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