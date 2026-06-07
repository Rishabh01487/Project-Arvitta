import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PFSupplier from '@/lib/models/PFSupplier'
import PFTransaction from '@/lib/models/PFTransaction'
import { getBusinessIdFromRequest } from '@/lib/auth'

// GET /api/suppliers/[id] — get supplier detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect()
  try {
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const supplier = await PFSupplier.findOne({ _id: id, businessId })
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })

    // Get recent transactions for this supplier
    const transactions = await PFTransaction.find({ supplierId: id, businessId })
      .sort({ createdAt: -1 })
      .limit(20)

    return NextResponse.json({ supplier, transactions })
  } catch (error) {
    console.error('Supplier detail error:', error)