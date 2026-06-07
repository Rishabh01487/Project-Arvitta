import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PFBusiness from '@/lib/models/PFBusiness'
import PFAccount from '@/lib/models/PFAccount'
import { getBusinessIdFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  await dbConnect()
  try {
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await PFBusiness.findById(businessId).select('-password -pin')
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const account = await PFAccount.findOne({ businessId })

    return NextResponse.json({
      business: {
        id: business._id,
        name: business.name,
        ownerName: business.ownerName,
        email: business.email,
        phone: business.phone,
        gstin: business.gstin,
        address: business.address,
        bankAccount: business.bankAccount,