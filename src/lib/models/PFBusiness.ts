import mongoose, { Schema, Document } from 'mongoose'

export interface IPFBusiness extends Document {
  name: string
  ownerName: string
  email: string
  phone: string
  password: string
  gstin?: string
  address: string
  pin: string
  bankAccount: {
    accountNumber?: string
    ifscCode?: string
    bankName?: string
    holderName?: string
    verified: boolean
  }
  razorpayContactId?: string
  razorpayFundAccountId?: string
  createdAt: Date
  updatedAt: Date
}

const PFBusinessSchema = new Schema<IPFBusiness>({
  name: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gstin: { type: String },