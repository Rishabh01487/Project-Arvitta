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