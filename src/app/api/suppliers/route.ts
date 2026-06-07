import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PFSupplier from '@/lib/models/PFSupplier'
import { getBusinessIdFromRequest } from '@/lib/auth'
import { createContact, createFundAccount } from '@/lib/engine/razorpayPayout'

// GET /api/suppliers — list all suppliers with optional filters
export async function GET(request: NextRequest) {
  await dbConnect()
  try {
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const search = request.nextUrl.searchParams.get('search') || ''
    const priority = request.nextUrl.searchParams.get('priority') || ''
    const category = request.nextUrl.searchParams.get('category') || ''
    const hasDue = request.nextUrl.searchParams.get('hasDue') === 'true'

    const query: Record<string, unknown> = { businessId, isActive: true }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }
    if (priority) query.priority = priority
    if (category) query.category = category
    if (hasDue) query.totalDue = { $gt: 0 }

    const suppliers = await PFSupplier.find(query)
      .sort({ priority: 1, totalDue: -1, name: 1 })

    const totalOutstanding = suppliers.reduce((sum, s) => sum + (s.totalDue || 0), 0)

    return NextResponse.json({ suppliers, totalOutstanding })
  } catch (error) {
    console.error('Suppliers GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

// POST /api/suppliers — add a new supplier
export async function POST(request: NextRequest) {
  await dbConnect()
  try {
    const businessId = getBusinessIdFromRequest(request)