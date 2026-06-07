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