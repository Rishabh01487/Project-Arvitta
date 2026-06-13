import PFAuditLog from '@/lib/models/PFAuditLog'

export async function logEvent(
  businessId: string,
  action: string,
  category: 'auth' | 'finance' | 'security' | 'system',
  status: 'success' | 'failure',
  description: string,
  metadata?: Record<string, any>,
  ipAddress?: string
) {
  try {
    await PFAuditLog.create({
      businessId,
      action,
      category,
      status,
      description,
      metadata,
      ipAddress,
    })
  } catch (error) {
    console.error('Failed to write audit log:', error)
  }
}
