import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { getBusinessIdFromRequest } from '@/lib/auth'
import PFAuditLog from '@/lib/models/PFAuditLog'

// GET /api/audit-logs — retrieve searchable/filterable audit logs
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // Build filter query
    const filter: Record<string, any> = { businessId }

    if (category && category !== 'all') {
      filter.category = category
    }

    if (status && status !== 'all') {
      filter.status = status
    }

    if (query) {
      filter.$or = [
        { action: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ]
    }

    const [logs, total] = await Promise.all([
      PFAuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PFAuditLog.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Audit logs fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

// POST /api/audit-logs — manually write an audit log
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, category, status, description, metadata } = await request.json()

    if (!action || !category || !status || !description) {
      return NextResponse.json({ error: 'Missing required audit parameters' }, { status: 400 })
    }

    const log = await PFAuditLog.create({
      businessId,
      action,
      category,
      status,
      description,
      metadata,
    })

    return NextResponse.json({ success: true, log })
  } catch (error) {
    console.error('Audit log creation error:', error)
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
  }
}
