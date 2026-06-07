import mongoose, { Schema, Document } from 'mongoose'

export interface IPFAccount extends Document {
  businessId: mongoose.Types.ObjectId
  balance: number
  totalCredited: number
  totalDebited: number
  lastCreditedAt: Date | null
  lastCreditAmount: number
  createdAt: Date
  updatedAt: Date
}

const PFAccountSchema = new Schema<IPFAccount>({
  businessId: { type: Schema.Types.ObjectId, ref: 'PFBusiness', required: true, unique: true },
  balance: { type: Number, default: 0, min: 0 },
  totalCredited: { type: Number, default: 0 },
  totalDebited: { type: Number, default: 0 },
  lastCreditedAt: { type: Date, default: null },
  lastCreditAmount: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.models.PFAccount || mongoose.model<IPFAccount>('PFAccount', PFAccountSchema)
