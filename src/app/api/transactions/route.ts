import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PFTransaction from '@/lib/models/PFTransaction'
import { getBusinessIdFromRequest } from '@/lib/auth'

// GET /api/transactions — list transactions with filters
export async function GET(request: NextRequest) {
  await dbConnect()
  try {
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')
    const method = request.nextUrl.searchParams.get('method') || ''
    const status = request.nextUrl.searchParams.get('status') || ''
    const supplierId = request.nextUrl.searchParams.get('supplierId') || ''

    const query: Record<string, unknown> = { businessId }
    if (method) query.method = method
    if (status) query.status = status
    if (supplierId) query.supplierId = supplierId

    const transactions = await PFTransaction.find(query)
      .populate('supplierId', 'name phone category priority')
      .sort({ createdAt: -1 })
      .limit(limit)

    // Aggregate stats
    const allTxns = await PFTransaction.find({ businessId })
    const stats = {