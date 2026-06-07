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
}

const PFNotificationSchema = new Schema<IPFNotification>({
  businessId: { type: Schema.Types.ObjectId, ref: 'PFBusiness', required: true, index: true },
  type: {
    type: String,
    enum: ['credit', 'payout_success', 'payout_failed', 'payout_batch_complete', 'reminder', 'system'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Schema.Types.Mixed },
  read: { type: Boolean, default: false },
  actionUrl: String,
}, { timestamps: true })

PFNotificationSchema.index({ businessId: 1, read: 1, createdAt: -1 })

export default mongoose.models.PFNotification || mongoose.model<IPFNotification>('PFNotification', PFNotificationSchema)
