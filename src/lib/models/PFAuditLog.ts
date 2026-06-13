import mongoose, { Schema, Document } from 'mongoose'

export interface IPFAuditLog extends Document {
  businessId: mongoose.Types.ObjectId
  action: string // 'login' | 'credit' | 'payout_init' | 'payout_complete' | 'pin_change' | 'settings_update'
  category: 'auth' | 'finance' | 'security' | 'system'
  status: 'success' | 'failure'
  description: string
  ipAddress?: string
  metadata?: Record<string, any>
  createdAt: Date
}

const PFAuditLogSchema = new Schema<IPFAuditLog>({
  businessId: { type: Schema.Types.ObjectId, ref: 'PFBusiness', required: true, index: true },
  action: { type: String, required: true },
  category: {
    type: String,
    enum: ['auth', 'finance', 'security', 'system'],
    required: true,
  },
  status: {
    type: String,
    enum: ['success', 'failure'],
    required: true,
  },
  description: { type: String, required: true },
  ipAddress: String,
  metadata: Schema.Types.Mixed,
}, { timestamps: { createdAt: true, updatedAt: false } })

// Optimized index for filtering by business and category/timestamp
PFAuditLogSchema.index({ businessId: 1, category: 1, createdAt: -1 })
PFAuditLogSchema.index({ businessId: 1, createdAt: -1 })

export default mongoose.models.PFAuditLog || mongoose.model<IPFAuditLog>('PFAuditLog', PFAuditLogSchema)
