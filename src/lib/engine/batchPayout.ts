import PFAccount from '@/lib/models/PFAccount'
import PFSupplier from '@/lib/models/PFSupplier'
import PFTransaction from '@/lib/models/PFTransaction'
import PFNotification from '@/lib/models/PFNotification'
import { createPayout, simulatePayoutResolution, isSimulationMode } from './razorpayPayout'
import { generateRefId } from '@/lib/auth'

export interface PaymentItem {
  supplierId: string
  amount: number
  method: 'UPI' | 'NEFT' | 'RTGS' | 'IMPS'
}

export interface PaymentResult {
  supplierId: string
  supplierName: string
  amount: number
  method: string
  status: 'completed' | 'failed'
  referenceId: string
  utrNumber?: string
  failureReason?: string
}

export interface BatchPayoutResult {
  totalProcessed: number
  successCount: number
  failCount: number
  totalPaid: number
  remainingBalance: number
  results: PaymentResult[]
}

/**
 * Execute a batch of payments to multiple suppliers.
 * 
 * Flow per payment:
 * 1. Validate supplier and amount
 * 2. Check sufficient balance
 * 3. Create transaction record (pending)
 * 4. Call Razorpay Payout API
 * 5. Update transaction with payout ID
 * 6. In simulation mode: auto-resolve after short delay
 * 7. Update supplier dues and account balance
 * 8. Create notification
 */
export async function executeBatchPayout(
  businessId: string,
  payments: PaymentItem[]
): Promise<BatchPayoutResult> {
  const account = await PFAccount.findOne({ businessId })
  if (!account) throw new Error('Account not found')

  // Validate total doesn't exceed balance
  const totalRequired = payments.reduce((sum, p) => sum + p.amount, 0)
  if (totalRequired > account.balance) {
    throw new Error(`Insufficient balance. Required: ₹${totalRequired.toLocaleString('en-IN')}, Available: ₹${account.balance.toLocaleString('en-IN')}`)
  }

  const results: PaymentResult[] = []
  let successCount = 0
  let failCount = 0
  let totalPaid = 0
  let currentBalance = account.balance

  for (const payment of payments) {
    const supplier = await PFSupplier.findById(payment.supplierId)
    if (!supplier) {
      results.push({
        supplierId: payment.supplierId,
        supplierName: 'Unknown',
        amount: payment.amount,
        method: payment.method,
        status: 'failed',
        referenceId: generateRefId(),
        failureReason: 'Supplier not found',
      })
      failCount++
      continue
    }

    if (payment.amount > currentBalance) {
      results.push({
        supplierId: payment.supplierId,
        supplierName: supplier.name,
        amount: payment.amount,
        method: payment.method,
        status: 'failed',
        referenceId: generateRefId(),
        failureReason: 'Insufficient balance for this payment',
      })
      failCount++
      continue
    }

    const refId = generateRefId()
    const balanceBefore = currentBalance

    // Create pending transaction
    const txn = await PFTransaction.create({
      businessId,
      supplierId: payment.supplierId,
      amount: payment.amount,
      method: payment.method,
      status: 'processing',
      referenceId: refId,
      balanceBefore,
      balanceAfter: balanceBefore - payment.amount,
      initiatedAt: new Date(),
    })

    try {
      // Call Razorpay Payout API
      const fundAccountId = supplier.bankDetails?.razorpayFundAccountId || 'sim_fund_account'
      const payout = await createPayout({
        fund_account_id: fundAccountId,
        amount: payment.amount * 100, // convert to paise
        currency: 'INR',
        mode: payment.method,
        purpose: 'vendor_bill',
        reference_id: refId,
        narration: `PayFlow payout to ${supplier.name}`,
      })

      // Update transaction with Razorpay details
      await PFTransaction.findByIdAndUpdate(txn._id, {
        razorpayPayoutId: payout.id,
        razorpayPayoutStatus: payout.status,
      })

      // In simulation mode, resolve immediately
      let finalStatus: 'completed' | 'failed' = 'completed'
      let utrNumber = payout.utr
      let failureReason: string | undefined

      if (isSimulationMode()) {
        const resolution = await simulatePayoutResolution(payout.id)
        if (resolution.status === 'processed') {
          finalStatus = 'completed'
          utrNumber = resolution.utr
        } else {
          finalStatus = 'failed'
          failureReason = resolution.failureReason
        }
      }

      if (finalStatus === 'completed') {
        // Deduct from balance
        currentBalance -= payment.amount
        await PFAccount.findByIdAndUpdate(account._id, {
          $inc: { balance: -payment.amount, totalDebited: payment.amount },
        })

        // Update supplier dues
        await PFSupplier.findByIdAndUpdate(payment.supplierId, {
          $inc: { totalDue: -payment.amount, totalPaid: payment.amount },
          lastPaidAt: new Date(),
        })

        // Update transaction
        await PFTransaction.findByIdAndUpdate(txn._id, {
          status: 'completed',
          utrNumber,
          balanceAfter: currentBalance,
          completedAt: new Date(),
          razorpayPayoutStatus: 'processed',
        })

        successCount++
        totalPaid += payment.amount

        results.push({
          supplierId: payment.supplierId,
          supplierName: supplier.name,
          amount: payment.amount,
          method: payment.method,
          status: 'completed',
          referenceId: refId,
          utrNumber,
        })
      } else {
        // Payment failed — don't deduct balance
        await PFTransaction.findByIdAndUpdate(txn._id, {
          status: 'failed',
          failureReason,
          razorpayPayoutStatus: 'failed',
        })
        failCount++

        results.push({
          supplierId: payment.supplierId,