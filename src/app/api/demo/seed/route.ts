import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { getBusinessIdFromRequest } from '@/lib/auth'
import PFAccount from '@/lib/models/PFAccount'
import PFSupplier from '@/lib/models/PFSupplier'
import PFTransaction from '@/lib/models/PFTransaction'
import PFNotification from '@/lib/models/PFNotification'
import PFCreditEvent from '@/lib/models/PFCreditEvent'

export async function POST(request: NextRequest) {
  await dbConnect()
  try {
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Clear existing data for this business
    await Promise.all([
      PFSupplier.deleteMany({ businessId }),
      PFTransaction.deleteMany({ businessId }),
      PFNotification.deleteMany({ businessId }),
      PFCreditEvent.deleteMany({ businessId }),
    ])

    // 2. Seed Account balance
    let account = await PFAccount.findOne({ businessId })
    if (!account) {
      account = new PFAccount({ businessId })
    }
    account.balance = 550000
    account.totalCredited = 1200000
    account.totalDebited = 650000
    account.lastCreditedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    account.lastCreditAmount = 200000
    await account.save()

    // 3. Seed Suppliers
    const suppliersData = [
      {
        name: 'Krishna Dairy Farm',
        phone: '9823019842',
        email: 'krishna.dairy@agrimail.in',
        category: 'dairy',
        priority: 'critical',
        totalDue: 120000,
        totalPaid: 350000,
        lastPaidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        bankDetails: {
          accountNumber: '1100223344',
          ifscCode: 'KKBK0000958',
          bankName: 'Kotak Mahindra Bank',
          holderName: 'Krishna Dairy Farm',
          upiId: 'krishna@kotak',
        },
      },
      {
        name: 'Patel Grain Traders',
        phone: '9845012398',
        email: 'patel.grains@agrimail.in',
        category: 'grain',
        priority: 'high',
        totalDue: 250000,
        totalPaid: 200000,
        lastPaidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        bankDetails: {
          accountNumber: '3344556677',
          ifscCode: 'SBIN0001234',
          bankName: 'State Bank of India',
          holderName: 'Patel Grain Traders',
          upiId: 'patel@sbi',
        },
      },
      {
        name: 'Metro Packaging Solutions',
        phone: '9123456789',
        email: 'metro.pack@agrimail.in',
        category: 'packaging',
        priority: 'medium',
        totalDue: 80000,
        totalPaid: 100000,
        lastPaidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        bankDetails: {
          accountNumber: '5566778899',
          ifscCode: 'HDFC0000124',
          bankName: 'HDFC Bank',
          holderName: 'Metro Packaging Solutions',
          upiId: 'metro@hdfc',
        },
      },
      {
        name: 'Mahalaxmi Transport',
        phone: '9988776655',
        category: 'transport',
        priority: 'low',
        totalDue: 15000,
        totalPaid: 80000,
        lastPaidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        bankDetails: {
          accountNumber: '9988776655',
          ifscCode: 'ICIC0000245',