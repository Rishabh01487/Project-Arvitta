import mongoose, { Schema, Document } from 'mongoose'

export interface IPFTransaction extends Document {
  businessId: mongoose.Types.ObjectId
  supplierId: mongoose.Types.ObjectId
  amount: number
  method: string
  status: string
  razorpayPayoutId?: string
  razorpayPayoutStatus?: string
  referenceId: string
  utrNumber?: string
  balanceBefore: number
  balanceAfter: number
  grossAmount: number
  tdsRate: number
  tdsAmount: number
  gstRate: number
  gstAmount: number
  netAmount: number
  failureReason?: string
  initiatedAt: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PFTransactionSchema = new Schema<IPFTransaction>({
  businessId: { type: Schema.Types.ObjectId, ref: 'PFBusiness', required: true, index: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'PFSupplier', required: true, index: true },
  amount: { type: Number, required: true, min: 1 }, // gross amount settled
  method: {
    type: String,
    enum: ['UPI', 'NEFT', 'RTGS', 'IMPS'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'reversed'],
    default: 'pending',
  },
  razorpayPayoutId: String,
  razorpayPayoutStatus: String,
  referenceId: { type: String, required: true, unique: true },
  utrNumber: String,
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  grossAmount: { type: Number, required: true },
  tdsRate: { type: Number, default: 0 },
  tdsAmount: { type: Number, default: 0 },
  gstRate: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  failureReason: String,
  initiatedAt: { type: Date, default: Date.now },
  completedAt: Date,
}, { timestamps: true })

PFTransactionSchema.index({ businessId: 1, createdAt: -1 })
PFTransactionSchema.index({ supplierId: 1, createdAt: -1 })

export default mongoose.models.PFTransaction || mongoose.model<IPFTransaction>('PFTransaction', PFTransactionSchema)
