import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PFBusiness from '@/lib/models/PFBusiness'
import PFAccount from '@/lib/models/PFAccount'
import { hashPassword, hashPin, signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  await dbConnect()
  try {
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