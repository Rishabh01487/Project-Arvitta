import PFAccount from '@/lib/models/PFAccount'
import PFSupplier from '@/lib/models/PFSupplier'
import PFTransaction from '@/lib/models/PFTransaction'
import PFNotification from '@/lib/models/PFNotification'
import { createPayout, simulatePayoutResolution, isSimulationMode } from './razorpayPayout'
import { generateRefId } from '@/lib/auth'
import { logEvent } from '@/lib/audit'

export interface PaymentItem {
  supplierId: string
  amount: number
  method: 'UPI' | 'NEFT' | 'RTGS' | 'IMPS'
}

export interface PaymentResult {
  supplierId: string
  supplierName: string
  amount: number // gross settled
  netAmount: number
  tdsAmount: number
  gstAmount: number
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
  totalPaidGross: number
  totalPaidNet: number
  totalTdsWithheld: number
  remainingBalance: number
  results: PaymentResult[]
}

/**
 * Execute a batch of payments to multiple suppliers.
 * 
 * Flow per payment:
 * 1. Fetch supplier and calculate tax withholding (TDS) and GST parts:
 *    - Base Taxable Value = Gross Amount / 1.18 (if supplier has GSTIN)
 *    - GST Amount = Gross Amount - Base Taxable Value
 *    - TDS Amount = Math.round(Base Taxable Value * (tdsRate / 100))
 *    - Net Payout Amount = Gross Amount - TDS Amount
 * 2. Validate sufficient wallet balance against Net Amount
 * 3. Create transaction record (pending) with gross, net, TDS, and GST fields
 * 4. Call Razorpay Payout API (sends net cash)
 * 5. Update transaction with payout ID
 * 6. In simulation mode: auto-resolve after short delay
 * 7. If completed, deduct netAmount from wallet balance, and full grossAmount from supplier totalDue
 * 8. Log system notifications and DB-backed security audit logs
 */
export async function executeBatchPayout(
  businessId: string,
  payments: PaymentItem[]
): Promise<BatchPayoutResult> {
  const account = await PFAccount.findOne({ businessId })
  if (!account) throw new Error('Account not found')

  // Log batch initiation
  await logEvent(
    businessId,
    'payout_init',
    'finance',
    'success',
    `Initiating batch payout process for ${payments.length} payment items.`
  )

  // Pre-fetch suppliers and compute required net balances for validation
  const calculatedPayments = []
  let totalRequiredNet = 0

  for (const payment of payments) {
    const supplier = await PFSupplier.findById(payment.supplierId)
    if (!supplier) {
      calculatedPayments.push({ payment, error: 'Supplier not found' })
      continue
    }

    const gstin = supplier.gstin || ''
    const gstRate = gstin ? 18 : 0 // 18% default GST for registered suppliers
    const taxableValue = gstRate > 0 ? payment.amount / 1.18 : payment.amount
    const gstAmount = gstRate > 0 ? Math.round(payment.amount - taxableValue) : 0
    const tdsRate = supplier.tdsRate !== undefined ? supplier.tdsRate : 1
    const tdsAmount = Math.round(taxableValue * (tdsRate / 100))
    const netAmount = payment.amount - tdsAmount

    calculatedPayments.push({
      payment,
      supplier,
      netAmount,
      tdsAmount,
      gstAmount,
      gstRate,
      tdsRate,
    })

    totalRequiredNet += netAmount
  }

  // Validate account balance against net cash payouts
  if (totalRequiredNet > account.balance) {
    const errMsg = `Insufficient balance in wallet. Net Cash Required: ₹${totalRequiredNet.toLocaleString('en-IN')}, Available: ₹${account.balance.toLocaleString('en-IN')}`
    await logEvent(businessId, 'payout_init', 'finance', 'failure', errMsg)
    throw new Error(errMsg)
  }

  const results: PaymentResult[] = []
  let successCount = 0
  let failCount = 0
  let totalPaidGross = 0
  let totalPaidNet = 0
  let totalTdsWithheld = 0
  let currentBalance = account.balance

  for (const item of calculatedPayments) {
    const { payment } = item

    if ('error' in item) {
      results.push({
        supplierId: payment.supplierId,
        supplierName: 'Unknown',
        amount: payment.amount,
        netAmount: payment.amount,
        tdsAmount: 0,
        gstAmount: 0,
        method: payment.method,
        status: 'failed',
        referenceId: generateRefId(),
        failureReason: item.error,
      })
      failCount++
      continue
    }

    const { supplier, netAmount, tdsAmount, gstAmount, gstRate, tdsRate } = item

    if (netAmount > currentBalance) {
      results.push({
        supplierId: payment.supplierId,
        supplierName: supplier.name,
        amount: payment.amount,
        netAmount,
        tdsAmount,
        gstAmount,
        method: payment.method,
        status: 'failed',
        referenceId: generateRefId(),
        failureReason: 'Insufficient wallet balance for this net payout',
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
      amount: payment.amount, // Settled gross invoice amount
      method: payment.method,
      status: 'processing',
      referenceId: refId,
      balanceBefore,
      balanceAfter: balanceBefore - netAmount,
      grossAmount: payment.amount,
      tdsRate,
      tdsAmount,
      gstRate,
      gstAmount,
      netAmount,
      initiatedAt: new Date(),
    })

    try {
      // Call Razorpay Payout API with the net cash amount (in paise)
      const fundAccountId = supplier.bankDetails?.razorpayFundAccountId || 'sim_fund_account'
      const payout = await createPayout({
        fund_account_id: fundAccountId,
        amount: netAmount * 100, // convert net to paise
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
        // Deduct net amount from balance
        currentBalance -= netAmount
        await PFAccount.findByIdAndUpdate(account._id, {
          $inc: { balance: -netAmount, totalDebited: netAmount },
        })

        // Update supplier dues by full gross amount (since invoice is settled)
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
        totalPaidGross += payment.amount
        totalPaidNet += netAmount
        totalTdsWithheld += tdsAmount

        // Write to audit trail
        await logEvent(
          businessId,
          'payout_complete',
          'finance',
          'success',
          `Successfully processed payout of ₹${netAmount.toLocaleString('en-IN')} (Net) to ${supplier.name}. Settled Gross: ₹${payment.amount.toLocaleString('en-IN')}, TDS: ₹${tdsAmount.toLocaleString('en-IN')}.`,
          {
            transactionId: txn._id,
            supplierId: supplier._id,
            grossAmount: payment.amount,
            netAmount,
            tdsAmount,
            gstAmount,
            referenceId: refId,
            utrNumber,
          }
        )

        results.push({
          supplierId: payment.supplierId,
          supplierName: supplier.name,
          amount: payment.amount,
          netAmount,
          tdsAmount,
          gstAmount,
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

        await logEvent(
          businessId,
          'payout_complete',
          'finance',
          'failure',
          `Payout of ₹${netAmount.toLocaleString('en-IN')} (Net) to ${supplier.name} failed. Reason: ${failureReason}`,
          { supplierId: supplier._id, netAmount, referenceId: refId }
        )

        results.push({
          supplierId: payment.supplierId,
          supplierName: supplier.name,
          amount: payment.amount,
          netAmount,
          tdsAmount,
          gstAmount,
          method: payment.method,
          status: 'failed',
          referenceId: refId,
          failureReason,
        })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      await PFTransaction.findByIdAndUpdate(txn._id, {
        status: 'failed',
        failureReason: errorMsg,
      })
      failCount++

      await logEvent(
        businessId,
        'payout_complete',
        'finance',
        'failure',
        `Exception occurred during payout execution to ${supplier.name}. Error: ${errorMsg}`,
        { supplierId: supplier._id, amount: payment.amount, referenceId: refId }
      )

      results.push({
        supplierId: payment.supplierId,
        supplierName: supplier.name,
        amount: payment.amount,
        netAmount,
        tdsAmount,
        gstAmount,
        method: payment.method,
        status: 'failed',
        referenceId: refId,
        failureReason: errorMsg,
      })
    }
  }

  // Create batch completion notification
  await PFNotification.create({
    businessId,
    type: 'payout_batch_complete',
    title: `Batch Payout Complete`,
    message: `${successCount} of ${payments.length} payments processed. Net Paid: ₹${totalPaidNet.toLocaleString('en-IN')}, TDS: ₹${totalTdsWithheld.toLocaleString('en-IN')}`,
    data: { successCount, failCount, totalPaidGross, totalPaidNet, totalTdsWithheld, remainingBalance: currentBalance },
    actionUrl: '/transactions',
  })

  // Log final batch audit trail
  await logEvent(
    businessId,
    'payout_complete',
    'system',
    'success',
    `Batch payout processing complete. Success: ${successCount}, Failed: ${failCount}. Net debited: ₹${totalPaidNet.toLocaleString('en-IN')}.`
  )

  return {
    totalProcessed: payments.length,
    successCount,
    failCount,
    totalPaidGross,
    totalPaidNet,
    totalTdsWithheld,
    remainingBalance: currentBalance,
    results,
  }
}
