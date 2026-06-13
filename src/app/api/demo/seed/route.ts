import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { getBusinessIdFromRequest } from '@/lib/auth'
import PFAccount from '@/lib/models/PFAccount'
import PFSupplier from '@/lib/models/PFSupplier'
import PFTransaction from '@/lib/models/PFTransaction'
import PFNotification from '@/lib/models/PFNotification'
import PFCreditEvent from '@/lib/models/PFCreditEvent'
import PFAuditLog from '@/lib/models/PFAuditLog'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const businessId = getBusinessIdFromRequest(request)
    if (!businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Clear existing data for this business
    await Promise.all([
      PFSupplier.deleteMany({ businessId }),
      PFTransaction.deleteMany({ businessId }),
      PFNotification.deleteMany({ businessId }),
      PFCreditEvent.deleteMany({ businessId }),
      PFAuditLog.deleteMany({ businessId }),
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
      {
        name: 'Krishna Dairy Farm',
        phone: '9823019842',
        email: 'krishna.dairy@agrimail.in',
        category: 'dairy',
        priority: 'critical',
        totalDue: 120000,
        totalPaid: 350000,
        lastPaidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        tdsRate: 1, // 1% TDS
        gstin: '27KKKKK5555K1Z1',
        bankDetails: {
          accountNumber: '1100223344',
          ifscCode: 'KKBK0000958',
          bankName: 'Kotak Mahindra Bank',
          holderName: 'Krishna Dairy Farm',
          upiId: 'krishna@kotak',
        },
      },
      {
        name: 'Patel Grain Traders',
        phone: '9845012398',
        email: 'patel.grains@agrimail.in',
        category: 'grain',
        priority: 'high',
        totalDue: 250000,
        totalPaid: 200000,
        lastPaidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        tdsRate: 2, // 2% TDS
        gstin: '27PPPPP8888P2Z2',
        bankDetails: {
          accountNumber: '3344556677',
          ifscCode: 'SBIN0001234',
          bankName: 'State Bank of India',
          holderName: 'Patel Grain Traders',
          upiId: 'patel@sbi',
        },
      },
      {
        name: 'Metro Packaging Solutions',
        phone: '9123456789',
        email: 'metro.pack@agrimail.in',
        category: 'packaging',
        priority: 'medium',
        totalDue: 80000,
        totalPaid: 100000,
        lastPaidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        tdsRate: 1,
        gstin: '27MMMMM4444M3Z3',
        bankDetails: {
          accountNumber: '5566778899',
          ifscCode: 'HDFC0000124',
          bankName: 'HDFC Bank',
          holderName: 'Metro Packaging Solutions',
          upiId: 'metro@hdfc',
        },
      },
      {
        name: 'Mahalaxmi Transport',
        phone: '9988776655',
        category: 'transport',
        priority: 'low',
        totalDue: 15000,
        totalPaid: 80000,
        lastPaidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        tdsRate: 1,
        gstin: '27TTTTT7777T4Z4',
        bankDetails: {
          accountNumber: '9988776655',
          ifscCode: 'ICIC0000245',
          bankName: 'ICICI Bank',
          holderName: 'Mahalaxmi Transport',
        },
      },
      {
        name: 'Apex Farm Equipments',
        phone: '8877665544',
        category: 'equipment',
        priority: 'medium',
        totalDue: 0,
        totalPaid: 250000,
        lastPaidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        tdsRate: 2,
        gstin: '',
        bankDetails: {
          accountNumber: '2233445566',
          ifscCode: 'BARB0DBMUM',
          bankName: 'Bank of Baroda',
          holderName: 'Apex Farm Equipments',
        },
      },
    ]

    const suppliers = await PFSupplier.insertMany(
      suppliersData.map(s => ({ ...s, businessId }))
    )

    const sMap = suppliers.reduce((acc, curr) => {
      acc[curr.name] = curr._id
      return acc
    }, {} as Record<string, string>)

    // 4. Seed Transactions
    const txData = [
      {
        businessId,
        supplierId: sMap['Patel Grain Traders'],
        amount: 100000,
        method: 'NEFT',
        status: 'completed',
        referenceId: 'demo_ref_1001',
        utrNumber: 'UTRN12345678901',
        balanceBefore: 650000,
        balanceAfter: 550000,
        grossAmount: 100000,
        tdsRate: 2,
        tdsAmount: 1695,
        gstRate: 18,
        gstAmount: 15254,
        netAmount: 98305,
        initiatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        businessId,
        supplierId: sMap['Krishna Dairy Farm'],
        amount: 150000,
        method: 'UPI',
        status: 'completed',
        referenceId: 'demo_ref_1002',
        utrNumber: 'UTRU89234723901',
        balanceBefore: 800000,
        balanceAfter: 650000,
        grossAmount: 150000,
        tdsRate: 1,
        tdsAmount: 1271,
        gstRate: 18,
        gstAmount: 22881,
        netAmount: 148729,
        initiatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        businessId,
        supplierId: sMap['Metro Packaging Solutions'],
        amount: 50000,
        method: 'IMPS',
        status: 'completed',
        referenceId: 'demo_ref_1003',
        utrNumber: 'UTRM98234729301',
        balanceBefore: 850000,
        balanceAfter: 800000,
        grossAmount: 50000,
        tdsRate: 1,
        tdsAmount: 424,
        gstRate: 18,
        gstAmount: 7627,
        netAmount: 49576,
        initiatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        businessId,
        supplierId: sMap['Mahalaxmi Transport'],
        amount: 30000,
        method: 'UPI',
        status: 'failed',
        referenceId: 'demo_ref_1004',
        balanceBefore: 850000,
        balanceAfter: 850000,
        grossAmount: 30000,
        tdsRate: 1,
        tdsAmount: 254,
        gstRate: 18,
        gstAmount: 4576,
        netAmount: 29746,
        failureReason: 'Invalid beneficiary UPI ID',
        initiatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
    ]
    await PFTransaction.insertMany(txData)

    // 5. Seed Credit Events
    const creditEventsData = [
      {
        businessId,
        amount: 1000000,
        source: 'Direct Deposit',
        balanceBefore: 0,
        balanceAfter: 1000000,
        triggeredAutoMatch: true,
        suggestedPayoutTotal: 425000,
        suggestedSupplierCount: 3,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        businessId,
        amount: 200000,
        source: 'NEFT Inward',
        balanceBefore: 650000,
        balanceAfter: 850000,
        triggeredAutoMatch: true,
        suggestedPayoutTotal: 15000,
        suggestedSupplierCount: 1,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ]
    await PFCreditEvent.insertMany(creditEventsData)

    // 6. Seed Notifications
    const notificationData = [
      {
        businessId,
        type: 'payout_batch_complete',
        title: 'Batch Payout Completed',
        message: 'Successfully processed payments of ₹3,00,000 for 3 suppliers.',
        read: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        businessId,
        type: 'credit',
        title: 'Account Credited',
        message: 'Your Corporate Debit Wallet was credited with ₹2,00,000 via NEFT Inward.',
        read: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        businessId,
        type: 'payout_failed',
        title: 'Payout Failed',
        message: 'Payment of ₹30,000 to Mahalaxmi Transport failed (Invalid beneficiary UPI ID).',
        read: false,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
    ]
    await PFNotification.insertMany(notificationData)

    // 7. Seed Audit Logs
    const auditLogsData = [
      {
        businessId,
        action: 'credit',
        category: 'finance',
        status: 'success',
        description: 'Account credited with ₹10,00,000 via simulated Direct Deposit.',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        businessId,
        action: 'payout_init',
        category: 'finance',
        status: 'success',
        description: 'Initiated auto-match payment recommendations for pending supplier dues.',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        businessId,
        action: 'payout_complete',
        category: 'finance',
        status: 'success',
        description: 'Batch Payout executed. Paid ₹98,305 (Net) to Patel Grain Traders. TDS deducted: ₹1,695.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        businessId,
        action: 'payout_complete',
        category: 'finance',
        status: 'failure',
        description: 'Payout of ₹30,000 to Mahalaxmi Transport failed due to: Invalid beneficiary UPI ID.',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        businessId,
        action: 'settings_update',
        category: 'security',
        status: 'success',
        description: 'Modified corporate settings: toggled auto-match execution priority weights.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ]
    await PFAuditLog.insertMany(auditLogsData)

    return NextResponse.json({ success: true, message: 'Demo workspace populated successfully!' })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed workspace' }, { status: 500 })
  }
}
