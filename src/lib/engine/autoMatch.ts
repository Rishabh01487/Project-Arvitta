import PFSupplier from '@/lib/models/PFSupplier'
import PFAccount from '@/lib/models/PFAccount'

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
}

export interface AutoMatchResult {
  balance: number
  suggestedSuppliers: MatchedSupplier[]
  totalPayout: number
  remainingBalance: number
  totalDueAcrossAll: number
  unpayableCount: number
}

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

/**
 * Auto-match engine: given a business's current balance, find optimal set of suppliers to pay.
 * 
 * Strategy:
 * 1. Sort by priority (critical first), then by oldest unpaid (lastPaidAt ascending)
 * 2. Greedy fit: include supplier if their totalDue fits within remaining balance
 * 3. Return suggestion list with amounts
 */