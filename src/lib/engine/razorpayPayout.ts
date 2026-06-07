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