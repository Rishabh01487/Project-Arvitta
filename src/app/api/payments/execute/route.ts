import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PFBusiness from '@/lib/models/PFBusiness'
import { getBusinessIdFromRequest, comparePin } from '@/lib/auth'
import { executeBatchPayout, PaymentItem } from '@/lib/engine/batchPayout'

// POST /api/payments/execute — execute batch payment
export async function POST(request: NextRequest) {
  await dbConnect()
  try {
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { pin, payments } = await request.json() as { pin: string; payments: PaymentItem[] }

    if (!pin) return NextResponse.json({ error: 'Transaction PIN is required' }, { status: 400 })
    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json({ error: 'At least one payment is required' }, { status: 400 })
    }

    // Verify PIN
    const business = await PFBusiness.findById(businessId)
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const pinValid = await comparePin(pin, business.pin)
    if (!pinValid) return NextResponse.json({ error: 'Invalid transaction PIN' }, { status: 403 })

    // Validate each payment
    for (const p of payments) {
      if (!p.supplierId || !p.amount || p.amount < 1 || !p.method) {
        return NextResponse.json({
          error: 'Each payment must have supplierId, amount (min ₹1), and method (UPI/NEFT/RTGS/IMPS)',
        }, { status: 400 })
      }
    }

    // Execute batch
    const result = await executeBatchPayout(businessId, payments)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Batch payment failed'
    console.error('Payment execute error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
