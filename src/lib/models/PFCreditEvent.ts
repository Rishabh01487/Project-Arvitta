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
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  triggeredAutoMatch: { type: Boolean, default: false },
  suggestedPayoutTotal: { type: Number, default: 0 },
  suggestedSupplierCount: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.models.PFCreditEvent || mongoose.model<IPFCreditEvent>('PFCreditEvent', PFCreditEventSchema)
