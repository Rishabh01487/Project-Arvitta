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