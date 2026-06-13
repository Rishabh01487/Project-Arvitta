import PFSupplier from '@/lib/models/PFSupplier'
import PFAccount from '@/lib/models/PFAccount'
import PFBusiness from '@/lib/models/PFBusiness'

export interface MatchedSupplier {
  _id: string
  name: string
  phone: string
  category: string
  priority: string
  totalDue: number
  suggestedAmount: number
  bankDetails: {
    accountNumber?: string
    ifscCode?: string
    bankName?: string
    holderName?: string
    upiId?: string
  }
  isPartial?: boolean
  originalDue?: number
  percentagePaid?: number
  tdsRate?: number
  gstin?: string
}

export interface AutoMatchResult {
  balance: number
  suggestedSuppliers: MatchedSupplier[]
  totalPayout: number
  remainingBalance: number
  totalDueAcrossAll: number
  unpayableCount: number
  enableFractional: boolean
  fractionalThreshold: number
}

/**
 * Auto-match engine: given a business's current balance, find optimal set of suppliers to pay.
 * 
 * Strategy:
 * 1. Read custom priority weights from business settings (critical > high > medium > low by default).
 * 2. Sort by weight descending (highest weight first), then by oldest unpaid (lastPaidAt ascending).
 * 3. Greedy fit: include full payment if remaining balance is sufficient.
 * 4. If full payment is not possible but fractional payouts are enabled, check if the partial
 *    amount (due * threshold%) can fit in the remaining balance. If yes, suggest the partial amount.
 * 5. Return suggestions with details.
 */
export async function runAutoMatch(businessId: string): Promise<AutoMatchResult> {
  const [account, business] = await Promise.all([
    PFAccount.findOne({ businessId }),
    PFBusiness.findById(businessId),
  ])

  if (!account) throw new Error('Account not found')
  if (!business) throw new Error('Business not found')

  const balance = account.balance

  // Read auto-match settings with fallbacks
  const settings = business.autoMatchSettings || {
    priorityWeights: { critical: 100, high: 75, medium: 50, low: 25 },
    enableFractional: false,
    fractionalThreshold: 50,
  }

  const weights: Record<string, number> = settings.priorityWeights || {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
  }

  const enableFractional = !!settings.enableFractional
  const fractionalThreshold = settings.fractionalThreshold || 50

  // Get all active suppliers with outstanding dues
  const suppliers = await PFSupplier.find({
    businessId,
    isActive: true,
    totalDue: { $gt: 0 },
  }).sort({ lastPaidAt: 1 }) // oldest unpaid first

  // Sort by priority weight descending first, then by lastPaidAt (already sorted from DB)
  const sorted = [...suppliers].sort((a, b) => {
    const wa = weights[a.priority] !== undefined ? weights[a.priority] : 50
    const wb = weights[b.priority] !== undefined ? weights[b.priority] : 50
    if (wa !== wb) return wb - wa // highest weight first
    
    // Within same priority weight, oldest unpaid first
    const aTime = a.lastPaidAt ? a.lastPaidAt.getTime() : 0
    const bTime = b.lastPaidAt ? b.lastPaidAt.getTime() : 0
    return aTime - bTime
  })

  const suggested: MatchedSupplier[] = []
  let remaining = balance
  let totalPayout = 0
  const totalDueAcrossAll = sorted.reduce((sum, s) => sum + s.totalDue, 0)
  let unpayableCount = 0

  for (const supplier of sorted) {
    if (supplier.totalDue <= remaining) {
      // Fit full payment
      suggested.push({
        _id: supplier._id.toString(),
        name: supplier.name,
        phone: supplier.phone,
        category: supplier.category,
        priority: supplier.priority,
        totalDue: supplier.totalDue,
        suggestedAmount: supplier.totalDue,
        bankDetails: {
          accountNumber: supplier.bankDetails?.accountNumber,
          ifscCode: supplier.bankDetails?.ifscCode,
          bankName: supplier.bankDetails?.bankName,
          holderName: supplier.bankDetails?.holderName,
          upiId: supplier.bankDetails?.upiId,
        },
        isPartial: false,
        originalDue: supplier.totalDue,
        percentagePaid: 100,
        tdsRate: supplier.tdsRate,
        gstin: supplier.gstin,
      })
      remaining -= supplier.totalDue
      totalPayout += supplier.totalDue
    } else if (enableFractional) {
      // Try fractional fit
      const partialAmount = Math.floor(supplier.totalDue * (fractionalThreshold / 100))
      
      // Make sure the fractional amount is at least 1 and fits in remaining balance
      if (partialAmount >= 1 && partialAmount <= remaining) {
        suggested.push({
          _id: supplier._id.toString(),
          name: supplier.name,
          phone: supplier.phone,
          category: supplier.category,
          priority: supplier.priority,
          totalDue: supplier.totalDue,
          suggestedAmount: partialAmount,
          bankDetails: {
            accountNumber: supplier.bankDetails?.accountNumber,
            ifscCode: supplier.bankDetails?.ifscCode,
            bankName: supplier.bankDetails?.bankName,
            holderName: supplier.bankDetails?.holderName,
            upiId: supplier.bankDetails?.upiId,
          },
          isPartial: true,
          originalDue: supplier.totalDue,
          percentagePaid: fractionalThreshold,
          tdsRate: supplier.tdsRate,
          gstin: supplier.gstin,
        })
        remaining -= partialAmount
        totalPayout += partialAmount
      } else {
        unpayableCount++
      }
    } else {
      unpayableCount++
    }
  }

  return {
    balance,
    suggestedSuppliers: suggested,
    totalPayout,
    remainingBalance: remaining,
    totalDueAcrossAll,
    unpayableCount,
    enableFractional,
    fractionalThreshold,
  }
}
