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
export const RECURRENCE_PERIODS = ['Monthly', 'Quarterly', 'One-time']

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const ENTRY_TYPES = ['Post', 'Story', 'Reel', 'GMB']
export const CONTENT_PILLARS = ['Product Promotion', 'Lifestyle', 'Community', 'Traffic-Driving', 'Atmosphere', 'Other']

// ---------------------------------------------------------------------------
// Status badge styles
// ---------------------------------------------------------------------------
export function statusBadgeClass(status) {
  switch (status) {
    case 'Draft':       return 'bg-[#1a2d4e] text-[#7a9cc0] border border-[#243d68]'
    case 'In Review':   return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    case 'Published':   return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    case 'paid':        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    case 'overdue':     return 'bg-red-500/10 text-red-400 border border-red-500/20'
    case 'due-soon':    return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    case 'unpaid':      return 'bg-[#1a2d4e] text-[#7a9cc0] border border-[#243d68]'
    default:            return 'bg-[#1a2d4e] text-[#7a9cc0] border border-[#243d68]'
  }
}

export function typeBadgeClass(type) {
  return type === 'Client'
    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
}

export function entryTypeBadgeClass(type) {
  switch (type) {
    case 'Post':  return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    case 'Story': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    case 'Reel':  return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    case 'GMB':   return 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
    default:      return 'bg-[#1a2d4e] text-[#7a9cc0] border border-[#243d68]'
  }
}
