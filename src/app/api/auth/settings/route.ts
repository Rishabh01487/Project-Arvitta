import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { getBusinessIdFromRequest } from '@/lib/auth'
import PFBusiness from '@/lib/models/PFBusiness'
import { logEvent } from '@/lib/audit'

// POST /api/auth/settings — update business settings & autoMatch config
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ownerName, address, gstin, autoMatchSettings } = body

    const updateFields: Record<string, any> = {}
    if (ownerName) updateFields.ownerName = ownerName
    if (address) updateFields.address = address
    if (gstin !== undefined) updateFields.gstin = gstin

    if (autoMatchSettings) {
      updateFields.autoMatchSettings = {
        priorityWeights: {
          critical: autoMatchSettings.priorityWeights?.critical ?? 100,
          high: autoMatchSettings.priorityWeights?.high ?? 75,
          medium: autoMatchSettings.priorityWeights?.medium ?? 50,
          low: autoMatchSettings.priorityWeights?.low ?? 25,
        },
        enableFractional: !!autoMatchSettings.enableFractional,
        fractionalThreshold: autoMatchSettings.fractionalThreshold ?? 50,
      }
    }

    const business = await PFBusiness.findByIdAndUpdate(
      businessId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password -pin')

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Log this update in the security audit logs
    await logEvent(
      businessId,
      'settings_update',
      'security',
      'success',
      'Modified business profile and auto-match engine config.',
      { updatedSettings: updateFields }
    )

    return NextResponse.json({
      success: true,
      business: {
        id: business._id,
        name: business.name,
        ownerName: business.ownerName,
        email: business.email,
        phone: business.phone,
        address: business.address,
        gstin: business.gstin,
        autoMatchSettings: business.autoMatchSettings,
      },
    })
  } catch (error) {
    console.error('Settings update error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Failed to update settings'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
