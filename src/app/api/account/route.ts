import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PFAccount from '@/lib/models/PFAccount'
import PFCreditEvent from '@/lib/models/PFCreditEvent'
import PFNotification from '@/lib/models/PFNotification'
import PFSupplier from '@/lib/models/PFSupplier'
import { getBusinessIdFromRequest } from '@/lib/auth'
import { runAutoMatch } from '@/lib/engine/autoMatch'

// GET /api/account — get balance + stats
export async function GET(request: NextRequest) {
  await dbConnect()
  try {
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const account = await PFAccount.findOne({ businessId })
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    // Get supplier stats
    const suppliers = await PFSupplier.find({ businessId, isActive: true })
    const totalDue = suppliers.reduce((sum, s) => sum + s.totalDue, 0)
    const supplierCount = suppliers.length
    const suppliersWithDue = suppliers.filter(s => s.totalDue > 0).length

    return NextResponse.json({
      account: {
        balance: account.balance,
        totalCredited: account.totalCredited,
        totalDebited: account.totalDebited,
        lastCreditedAt: account.lastCreditedAt,
        lastCreditAmount: account.lastCreditAmount,
      },
      stats: {
        totalDue,
        supplierCount,
        suppliersWithDue,
      },
    })
  } catch (error) {
    console.error('Account GET error:', error)
    return NextResponse.json({ error: 'Failed to get account' }, { status: 500 })
  }
}

// POST /api/account — credit the account (simulate bank credit)
export async function POST(request: NextRequest) {
  await dbConnect()
  try {
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount, source } = await request.json()
    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Amount must be at least ₹1' }, { status: 400 })
    }

    const account = await PFAccount.findOne({ businessId })
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    const balanceBefore = account.balance

    // Credit the account
    const updated = await PFAccount.findByIdAndUpdate(account._id, {
      $inc: { balance: amount, totalCredited: amount },
      lastCreditedAt: new Date(),
      lastCreditAmount: amount,
    }, { new: true })

    // Run auto-match to see what can be paid now
    const matchResult = await runAutoMatch(businessId)

    // Create credit event
    await PFCreditEvent.create({
      businessId,
      amount,
      source: source || 'Bank Transfer',
      balanceBefore,
      balanceAfter: updated!.balance,
      triggeredAutoMatch: matchResult.suggestedSuppliers.length > 0,
      suggestedPayoutTotal: matchResult.totalPayout,
      suggestedSupplierCount: matchResult.suggestedSuppliers.length,
    })

    // Create notification
    const notifMessage = matchResult.suggestedSuppliers.length > 0
      ? `₹${amount.toLocaleString('en-IN')} credited! You can now pay ${matchResult.suggestedSuppliers.length} supplier(s) totaling ₹${matchResult.totalPayout.toLocaleString('en-IN')}.`
      : `₹${amount.toLocaleString('en-IN')} credited to your account. No pending supplier dues to pay.`

    await PFNotification.create({
      businessId,
      type: 'credit',
      title: '💰 Account Credited',
      message: notifMessage,
      data: {