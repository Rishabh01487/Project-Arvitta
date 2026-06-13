import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PFBusiness from '@/lib/models/PFBusiness'
import PFAccount from '@/lib/models/PFAccount'
import { hashPassword, hashPin, signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const { name, ownerName, email, phone, password, pin, gstin, address } = await request.json()

    if (!name || !ownerName || !email || !phone || !password || !pin || !address) {
      return NextResponse.json({ error: 'All fields are required: name, ownerName, email, phone, password, pin, address' }, { status: 400 })
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 })
    }

    // Check existing
    const existing = await PFBusiness.findOne({ $or: [{ email }, { phone }] })
    if (existing) {
      return NextResponse.json({ error: 'Business with this email or phone already exists' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)
    const hashedPin = await hashPin(pin)

    const business = await PFBusiness.create({
      name,
      ownerName,
      email,
      phone,
      password: hashedPassword,
      pin: hashedPin,
      gstin: gstin || '',
      address,
    })

    // Create associated account with 0 balance
    await PFAccount.create({
      businessId: business._id,
      balance: 0,
      totalCredited: 0,
      totalDebited: 0,
    })

    const token = signToken({
      businessId: business._id.toString(),
      email: business.email,
      name: business.name,
    })

    return NextResponse.json({
      success: true,
      token,
      business: {
        id: business._id,
        name: business.name,
        ownerName: business.ownerName,
        email: business.email,
        phone: business.phone,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
