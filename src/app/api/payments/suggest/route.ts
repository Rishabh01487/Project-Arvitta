import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { getBusinessIdFromRequest } from '@/lib/auth'
import { runAutoMatch } from '@/lib/engine/autoMatch'

// GET /api/payments/suggest — get auto-match suggestions
export async function GET(request: NextRequest) {
  await dbConnect()
  try {
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await runAutoMatch(businessId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Payment suggest error:', error)
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
