import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PFNotification from '@/lib/models/PFNotification'
import { getBusinessIdFromRequest } from '@/lib/auth'

// GET /api/notifications — list notifications
export async function GET(request: NextRequest) {
  try {

    await dbConnect()
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '30')
    const notifications = await PFNotification.find({ businessId })
      .sort({ createdAt: -1 })
      .limit(limit)

    const unreadCount = await PFNotification.countDocuments({ businessId, read: false })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// POST /api/notifications — mark notifications as read
export async function POST(request: NextRequest) {
  await dbConnect()
  try {
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { ids, markAll } = await request.json()

    if (markAll) {
      await PFNotification.updateMany({ businessId, read: false }, { read: true })
    } else if (ids && Array.isArray(ids)) {
      await PFNotification.updateMany({ _id: { $in: ids }, businessId }, { read: true })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notifications POST error:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
