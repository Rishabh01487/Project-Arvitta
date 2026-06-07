import mongoose, { Schema, Document } from 'mongoose'

export interface IPFSupplier extends Document {
  businessId: mongoose.Types.ObjectId
  name: string
  phone: string
  email?: string
  category: string
  priority: string
  notes?: string
  totalDue: number
  totalPaid: number
  lastPaidAt: Date | null
  bankDetails: {
    accountNumber?: string
    ifscCode?: string
    bankName?: string
    holderName?: string
    upiId?: string
    razorpayContactId?: string
    razorpayFundAccountId?: string
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const PFSupplierSchema = new Schema<IPFSupplier>({
  businessId: { type: Schema.Types.ObjectId, ref: 'PFBusiness', required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  category: {
    type: String,
    enum: ['raw-materials', 'dairy', 'grain', 'packaging', 'transport', 'equipment', 'services', 'other'],
    default: 'other',
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium',
  },