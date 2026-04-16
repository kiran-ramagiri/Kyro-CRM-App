import { mockAccounts, mockContent, mockPayments } from './mockData'

// ---------------------------------------------------------------------------
// Dev mock store (in-memory, resets on page reload)
// ---------------------------------------------------------------------------
let _accounts = [...mockAccounts]
let _content  = [...mockContent]
let _payments = [...mockPayments]

function mockDelay() { return new Promise(r => setTimeout(r, 120)) }

async function mockGet(sheet) {
  await mockDelay()
  if (sheet === 'Accounts') return JSON.parse(JSON.stringify(_accounts))
  if (sheet === 'Content')  return JSON.parse(JSON.stringify(_content))
  if (sheet === 'Payments') return JSON.parse(JSON.stringify(_payments))
  return []
}

async function mockPost({ action, sheet, data, id }) {
  await mockDelay()
  const store = sheet === 'Accounts' ? _accounts : sheet === 'Content' ? _content : _payments

  if (action === 'append') {
    store.push({ ...data })
  } else if (action === 'update') {
    const idx = store.findIndex(r => r.id === id)
    if (idx !== -1) store[idx] = { ...store[idx], ...data }
  } else if (action === 'delete') {
    const idx = store.findIndex(r => r.id === id)
    if (idx !== -1) store.splice(idx, 1)
  }
  return { success: true }
}

// ---------------------------------------------------------------------------
// Real API (production — calls Vercel serverless function)
// ---------------------------------------------------------------------------
const BASE = '/api/sheets'

async function request(method, params = {}, body = null) {
  const url = method === 'GET'
    ? `${BASE}?${new URLSearchParams(params)}`
    : BASE

  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  return json
}

// ---------------------------------------------------------------------------
// Public API — routes to mock in dev, real in prod
// ---------------------------------------------------------------------------
const DEV = import.meta.env.DEV

export const getAccounts = () => DEV ? mockGet('Accounts') : request('GET', { sheet: 'Accounts' })
export const getContent  = () => DEV ? mockGet('Content')  : request('GET', { sheet: 'Content' })
export const getPayments = () => DEV ? mockGet('Payments') : request('GET', { sheet: 'Payments' })

export const addAccount    = (data)     => DEV ? mockPost({ action: 'append', sheet: 'Accounts', data })         : request('POST', {}, { action: 'append', sheet: 'Accounts', data })
export const updateAccount = (id, data) => DEV ? mockPost({ action: 'update', sheet: 'Accounts', id, data })     : request('POST', {}, { action: 'update', sheet: 'Accounts', id, data })

export const addContent    = (data)     => DEV ? mockPost({ action: 'append', sheet: 'Content', data })          : request('POST', {}, { action: 'append', sheet: 'Content', data })
export const updateContent = (id, data) => DEV ? mockPost({ action: 'update', sheet: 'Content', id, data })      : request('POST', {}, { action: 'update', sheet: 'Content', id, data })
export const deleteContent = (id)       => DEV ? mockPost({ action: 'delete', sheet: 'Content', id })            : request('POST', {}, { action: 'delete', sheet: 'Content', id })

export const addPayment    = (data)     => DEV ? mockPost({ action: 'append', sheet: 'Payments', data })         : request('POST', {}, { action: 'append', sheet: 'Payments', data })
export const updatePayment = (id, data) => DEV ? mockPost({ action: 'update', sheet: 'Payments', id, data })     : request('POST', {}, { action: 'update', sheet: 'Payments', id, data })
export const deletePayment = (id)       => DEV ? mockPost({ action: 'delete', sheet: 'Payments', id })           : request('POST', {}, { action: 'delete', sheet: 'Payments', id })
