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
  failureReason?: string
  initiatedAt: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PFTransactionSchema = new Schema<IPFTransaction>({
  businessId: { type: Schema.Types.ObjectId, ref: 'PFBusiness', required: true, index: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'PFSupplier', required: true, index: true },
  amount: { type: Number, required: true, min: 1 },
  method: {
    type: String,
    enum: ['UPI', 'NEFT', 'RTGS', 'IMPS'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'reversed'],
    default: 'pending',