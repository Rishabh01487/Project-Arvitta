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