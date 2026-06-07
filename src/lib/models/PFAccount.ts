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