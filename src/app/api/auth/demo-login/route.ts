import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import PFBusiness from '@/lib/models/PFBusiness'
import PFAccount from '@/lib/models/PFAccount'
import PFSupplier from '@/lib/models/PFSupplier'
import PFTransaction from '@/lib/models/PFTransaction'
import PFNotification from '@/lib/models/PFNotification'
import PFCreditEvent from '@/lib/models/PFCreditEvent'
import { hashPassword, hashPin, signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  await dbConnect()
  try {
    const demoEmail = 'rajesh@agrifresh.in'
    
    // Find or create Rajesh demo account
    let business = await PFBusiness.findOne({ email: demoEmail })
    
    if (!business) {
      const hashedPassword = await hashPassword('Test1234')
      const hashedPin = await hashPin('1234')
      
      business = await PFBusiness.create({
        name: 'AgriFresh Foods Ltd',
        ownerName: 'Rajesh Kumar',
        email: demoEmail,
        phone: '9876543210',
        password: hashedPassword,
        pin: hashedPin,
        gstin: '27AAAAA1111A1Z1',
        address: 'MIDC Phase II, Pune, Maharashtra',
      })
    }
    
    const businessId = business._id

    // 1. Clear existing data for this business
    await Promise.all([
      PFSupplier.deleteMany({ businessId }),
      PFTransaction.deleteMany({ businessId }),
      PFNotification.deleteMany({ businessId }),
      PFCreditEvent.deleteMany({ businessId }),
    ])

    // 2. Seed Account balance
    let account = await PFAccount.findOne({ businessId })
    if (!account) {
      account = new PFAccount({ businessId })
    }
    account.balance = 550000
    account.totalCredited = 1200000
    account.totalDebited = 650000
    account.lastCreditedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    account.lastCreditAmount = 200000
    await account.save()

    // 3. Seed Suppliers
    const suppliersData = [