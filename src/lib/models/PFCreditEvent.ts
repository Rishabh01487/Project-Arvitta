import mongoose, { Schema, Document } from 'mongoose'

export interface IPFCreditEvent extends Document {
  businessId: mongoose.Types.ObjectId
  amount: number
  source: string
  balanceBefore: number
  balanceAfter: number
  triggeredAutoMatch: boolean
  suggestedPayoutTotal: number
  suggestedSupplierCount: number
  createdAt: Date
}

const PFCreditEventSchema = new Schema<IPFCreditEvent>({
  businessId: { type: Schema.Types.ObjectId, ref: 'PFBusiness', required: true, index: true },
  amount: { type: Number, required: true, min: 1 },
  source: { type: String, required: true },