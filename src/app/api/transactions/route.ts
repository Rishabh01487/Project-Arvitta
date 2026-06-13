import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PFTransaction from '@/lib/models/PFTransaction'
import { getBusinessIdFromRequest } from '@/lib/auth'

// GET /api/transactions — list transactions with filters
export async function GET(request: NextRequest) {
  try {

    await dbConnect()
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
      total: allTxns.length,
      completed: allTxns.filter(t => t.status === 'completed').length,
      failed: allTxns.filter(t => t.status === 'failed').length,
      processing: allTxns.filter(t => t.status === 'processing').length,
      totalAmount: allTxns.filter(t => t.status === 'completed').reduce((s, t) => s + t.amount, 0),
    }

    return NextResponse.json({ transactions, stats })
  } catch (error) {
    console.error('Transactions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
