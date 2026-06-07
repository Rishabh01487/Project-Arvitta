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