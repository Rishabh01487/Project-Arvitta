import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PFNotification from '@/lib/models/PFNotification'
import { getBusinessIdFromRequest } from '@/lib/auth'

// GET /api/notifications — list notifications
export async function GET(request: NextRequest) {
  await dbConnect()
  try {
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '30')
    const notifications = await PFNotification.find({ businessId })
      .sort({ createdAt: -1 })
      .limit(limit)