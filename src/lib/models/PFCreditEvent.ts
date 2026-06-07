import mongoose, { Schema, Document } from 'mongoose'

export interface IPFCreditEvent extends Document {
  businessId: mongoose.Types.ObjectId
  amount: number
  source: string
  balanceBefore: number
  balanceAfter: number
  triggeredAutoMatch: boolean