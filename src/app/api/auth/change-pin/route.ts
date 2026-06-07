import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PFBusiness from '@/lib/models/PFBusiness'
import { getBusinessIdFromRequest, comparePin, hashPin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  await dbConnect()
  try {
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
