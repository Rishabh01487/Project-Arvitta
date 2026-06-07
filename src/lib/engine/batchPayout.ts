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