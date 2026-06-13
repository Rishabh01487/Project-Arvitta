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
  tdsRate: number
  gstin: string
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
  notes: { type: String },
  totalDue: { type: Number, default: 0, min: 0 },
  totalPaid: { type: Number, default: 0 },
  lastPaidAt: { type: Date, default: null },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    holderName: String,
    upiId: String,
    razorpayContactId: String,
    razorpayFundAccountId: String,
  },
  isActive: { type: Boolean, default: true },
  tdsRate: { type: Number, default: 1, min: 0, max: 100 }, // default 1% TDS
  gstin: { type: String, default: '' },
}, { timestamps: true })

PFSupplierSchema.index({ businessId: 1, priority: 1 })
PFSupplierSchema.index({ businessId: 1, isActive: 1, totalDue: -1 })

export default mongoose.models.PFSupplier || mongoose.model<IPFSupplier>('PFSupplier', PFSupplierSchema)
