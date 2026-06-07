import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { getBusinessIdFromRequest } from '@/lib/auth'
import { runAutoMatch } from '@/lib/engine/autoMatch'

// GET /api/payments/suggest — get auto-match suggestions
export async function GET(request: NextRequest) {
  await dbConnect()
  try {
    const businessId = getBusinessIdFromRequest(request)