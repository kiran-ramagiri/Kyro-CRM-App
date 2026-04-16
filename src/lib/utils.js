// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
export function today() {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatCurrency(amount, currency = 'EUR') {
  const num = parseFloat(amount)
  if (isNaN(num)) return '—'
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: currency || 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
}

// ---------------------------------------------------------------------------
// Payment status helpers
// ---------------------------------------------------------------------------
export function paymentStatus(payment) {
  if (payment.paid) return 'paid'
  if (!payment.due_date) return 'unpaid'
  const due = new Date(payment.due_date + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 7) return 'due-soon'
  return 'unpaid'
}

export function isOverdue(payment) {
  return paymentStatus(payment) === 'overdue'
}

export function isDueSoon(payment) {
  return paymentStatus(payment) === 'due-soon'
}

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------
export function generateId() {
  return crypto.randomUUID()
}

// ---------------------------------------------------------------------------
// Platform display
// ---------------------------------------------------------------------------
export const PLATFORMS = [
  'Instagram', 'Facebook', 'Twitter/X', 'LinkedIn',
  'TikTok', 'Meta Ads', 'YouTube', 'Other',
]

export const TEAM_MEMBERS = ['Kiran', 'Rebeka']

export const ACCOUNT_TYPES = ['Client', 'Personal Brand']

export const CONTENT_STATUSES = ['Draft', 'In Review', 'Published']
export const CONTENT_TYPES = ['Social Post', 'Paid Ad']
export const RECURRENCE_PERIODS = ['Monthly', 'Quarterly', 'One-time']

// ---------------------------------------------------------------------------
// Status badge styles
// ---------------------------------------------------------------------------
export function statusBadgeClass(status) {
  switch (status) {
    case 'Draft':       return 'bg-slate-100 text-slate-600'
    case 'In Review':   return 'bg-blue-100 text-blue-700'
    case 'Published':   return 'bg-green-100 text-green-700'
    case 'paid':        return 'bg-green-100 text-green-700'
    case 'overdue':     return 'bg-red-100 text-red-700'
    case 'due-soon':    return 'bg-amber-100 text-amber-700'
    case 'unpaid':      return 'bg-slate-100 text-slate-600'
    default:            return 'bg-slate-100 text-slate-600'
  }
}

export function typeBadgeClass(type) {
  return type === 'Client'
    ? 'bg-violet-100 text-violet-700'
    : 'bg-sky-100 text-sky-700'
}
