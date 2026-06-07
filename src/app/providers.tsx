'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface Business {
  id: string
  name: string
  ownerName: string
  email: string
  phone: string
}

interface Account {
  balance: number
  totalCredited: number
  totalDebited: number
  lastCreditedAt: string | null
  lastCreditAmount: number
}

interface Notification {
  _id: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  actionUrl?: string
  createdAt: string
}

interface AuthContextType {
  token: string | null
  business: Business | null
  account: Account | null
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: Record<string, string>) => Promise<{ success: boolean; error?: string }>
  demoLogin: () => Promise<{ success: boolean; error?: string }>
  logout: () => void