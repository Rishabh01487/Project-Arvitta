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