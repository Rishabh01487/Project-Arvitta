import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PFBusiness from '@/lib/models/PFBusiness'
import { getBusinessIdFromRequest, comparePin, hashPin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  await dbConnect()
  try {
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { currentPin, newPin } = await request.json()
    if (!currentPin || !newPin) return NextResponse.json({ error: 'Both current and new PIN required' }, { status: 400 })
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      return NextResponse.json({ error: 'New PIN must be exactly 4 digits' }, { status: 400 })
    }

    const business = await PFBusiness.findById(businessId)
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const valid = await comparePin(currentPin, business.pin)
    if (!valid) return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 403 })

    const hashedNew = await hashPin(newPin)
    await PFBusiness.findByIdAndUpdate(businessId, { pin: hashedNew })

    return NextResponse.json({ success: true, message: 'PIN changed successfully' })
  } catch (error) {
    console.error('Change PIN error:', error)
    return NextResponse.json({ error: 'Failed to change PIN' }, { status: 500 })
  }
}
