import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PFCreditEvent from '@/lib/models/PFCreditEvent'
import { getBusinessIdFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  await dbConnect()
  try {
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20')