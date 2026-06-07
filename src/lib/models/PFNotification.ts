import mongoose, { Schema, Document } from 'mongoose'

export interface IPFNotification extends Document {
  businessId: mongoose.Types.ObjectId
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  actionUrl?: string
  createdAt: Date