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