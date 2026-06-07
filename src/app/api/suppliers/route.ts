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
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, phone, email, category, priority, notes, totalDue, bankDetails } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 })
    }

    // Create Razorpay contact for this supplier
    let razorpayContactId = ''
    let razorpayFundAccountId = ''

    try {
      const contact = await createContact({
        name,
        email: email || undefined,
        contact: phone,
        type: 'vendor',
      })
      razorpayContactId = contact.id

      // Create fund account if bank details provided
      if (bankDetails?.accountNumber && bankDetails?.ifscCode) {
        const fundAccount = await createFundAccount({
          contact_id: contact.id,
          account_type: 'bank_account',
          bank_account: {
            name: bankDetails.holderName || name,
            ifsc: bankDetails.ifscCode,
            account_number: bankDetails.accountNumber,
          },
        })
        razorpayFundAccountId = fundAccount.id
      } else if (bankDetails?.upiId) {
        const fundAccount = await createFundAccount({
          contact_id: contact.id,
          account_type: 'vpa',
          vpa: { address: bankDetails.upiId },
        })
        razorpayFundAccountId = fundAccount.id
      }
    } catch (err) {
      console.error('Razorpay contact creation error (non-fatal):', err)
    }

    const supplier = await PFSupplier.create({
      businessId,
      name,
      phone,
      email: email || '',
      category: category || 'other',
      priority: priority || 'medium',
      notes: notes || '',
      totalDue: totalDue || 0,
      bankDetails: {
        ...bankDetails,
        razorpayContactId,
        razorpayFundAccountId,
      },
    })

    return NextResponse.json({ success: true, supplier }, { status: 201 })
  } catch (error) {
    console.error('Supplier create error:', error)
    return NextResponse.json({ error: 'Failed to add supplier' }, { status: 500 })
  }
}
