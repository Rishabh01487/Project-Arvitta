/**
 * Razorpay Payout API wrapper
 * 
 * This wraps the RazorpayX Payouts API for:
 * - Creating contacts (suppliers)
 * - Creating fund accounts (bank account / UPI VPA)
 * - Initiating payouts (NEFT/RTGS/UPI/IMPS)
 * 
 * NOTE: Standard Razorpay keys (rzp_test_*) are for COLLECTING payments.
 * RazorpayX keys are needed for SENDING payments.
 * 
 * This module includes a SIMULATION MODE that mimics the API responses
 * when RazorpayX is not configured. Set RAZORPAY_PAYOUT_MODE=live in .env.local
 * to switch to real API calls.
 */

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || ''
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ''
const PAYOUT_MODE = process.env.RAZORPAY_PAYOUT_MODE || 'simulation' // 'simulation' | 'live'
const RAZORPAYX_ACCOUNT = process.env.RAZORPAYX_ACCOUNT_NUMBER || ''

const BASE_URL = 'https://api.razorpay.com/v1'

function getAuthHeader(): string {
  return 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')
}

function generateSimId(prefix: string): string {
  return `${prefix}_sim_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`
}

// ------- CONTACTS -------

export interface CreateContactPayload {
  name: string
  email?: string
  contact: string // phone
  type: 'vendor'
}

export interface RazorpayContact {
  id: string
  entity: string
  name: string
  contact: string
  email?: string
  type: string
  active: boolean
}

export async function createContact(payload: CreateContactPayload): Promise<RazorpayContact> {
  if (PAYOUT_MODE === 'simulation') {
    return {
      id: generateSimId('cont'),
      entity: 'contact',
      name: payload.name,
      contact: payload.contact,
      email: payload.email,
      type: 'vendor',
      active: true,
    }
  }

  const res = await fetch(`${BASE_URL}/contacts`, {
    method: 'POST',
    headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Razorpay createContact failed: ${await res.text()}`)
  return res.json()
}

// ------- FUND ACCOUNTS -------

export interface CreateFundAccountBankPayload {
  contact_id: string
  account_type: 'bank_account'
  bank_account: {
    name: string
    ifsc: string
    account_number: string
  }
}

export interface CreateFundAccountVPAPayload {
  contact_id: string
  account_type: 'vpa'
  vpa: {
    address: string // UPI ID
  }
}

export interface RazorpayFundAccount {
  id: string
  entity: string
  contact_id: string
  account_type: string
  active: boolean
}

export async function createFundAccount(
  payload: CreateFundAccountBankPayload | CreateFundAccountVPAPayload
): Promise<RazorpayFundAccount> {
  if (PAYOUT_MODE === 'simulation') {
    return {
      id: generateSimId('fa'),
      entity: 'fund_account',
      contact_id: payload.contact_id,
      account_type: payload.account_type,
      active: true,
    }
  }

  const res = await fetch(`${BASE_URL}/fund_accounts`, {
    method: 'POST',
    headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Razorpay createFundAccount failed: ${await res.text()}`)
  return res.json()
}

// ------- PAYOUTS -------

export interface CreatePayoutPayload {
  fund_account_id: string
  amount: number // in paise (₹1 = 100 paise)
  currency: 'INR'
  mode: 'UPI' | 'NEFT' | 'RTGS' | 'IMPS'
  purpose: 'vendor_bill' | 'payout'
  queue_if_low_balance?: boolean
  reference_id?: string
  narration?: string
}

export interface RazorpayPayout {
  id: string
  entity: string
  fund_account_id: string
  amount: number
  currency: string
  mode: string
  purpose: string
  status: string // 'processing' | 'processed' | 'reversed' | 'failed' | 'queued'
  utr?: string
  reference_id?: string
  narration?: string
  failure_reason?: string
}

export async function createPayout(payload: CreatePayoutPayload): Promise<RazorpayPayout> {
  if (PAYOUT_MODE === 'simulation') {
    // Simulate a ~2 second processing delay for realism
    const utr = `UTR${Date.now().toString().slice(-10)}`
    return {
      id: generateSimId('pout'),
      entity: 'payout',
      fund_account_id: payload.fund_account_id,
      amount: payload.amount,
      currency: 'INR',
      mode: payload.mode,
      purpose: payload.purpose,
      status: 'processing', // will be updated via simulated webhook
      utr,
      reference_id: payload.reference_id,
      narration: payload.narration,
    }
  }

  const body = {
    account_number: RAZORPAYX_ACCOUNT,
    ...payload,
  }

  const res = await fetch(`${BASE_URL}/payouts`, {
    method: 'POST',
    headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Razorpay createPayout failed: ${await res.text()}`)
  return res.json()
}

/**
 * In simulation mode, we auto-resolve payouts after a short delay.
 * This simulates the webhook callback that Razorpay would send.
 * Returns a "processed" status with a UTR number.
 */
export async function simulatePayoutResolution(payoutId: string): Promise<{
  status: 'processed' | 'failed'
  utr?: string
  failureReason?: string
}> {
  // 95% success rate in simulation
  const success = Math.random() > 0.05
  if (success) {
    return {
      status: 'processed',
      utr: `UTR${Date.now().toString().slice(-10)}`,
    }
  } else {
    return {
      status: 'failed',
      failureReason: 'Simulated: Beneficiary bank account is invalid or inactive',
    }
  }
}

export function isSimulationMode(): boolean {
  return PAYOUT_MODE === 'simulation'
}
