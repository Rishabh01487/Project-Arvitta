import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PFCreditEvent from '@/lib/models/PFCreditEvent'
import { getBusinessIdFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {

    await dbConnect()
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20')
    const events = await PFCreditEvent.find({ businessId })
      .sort({ createdAt: -1 })
      .limit(limit)

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Credit history error:', error)
    return NextResponse.json({ error: 'Failed to fetch credit history' }, { status: 500 })
  }
}
