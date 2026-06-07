import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PFBusiness from '@/lib/models/PFBusiness'
import { comparePassword, signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  await dbConnect()
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const business = await PFBusiness.findOne({ email })
    if (!business) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 404 })
    }

    const valid = await comparePassword(password, business.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = signToken({
      businessId: business._id.toString(),
      email: business.email,
      name: business.name,
    })

    return NextResponse.json({
      success: true,