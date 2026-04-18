import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Edit2, Trash2, RefreshCw, ExternalLink,
  Package, AlertCircle, CheckCircle,
} from 'lucide-react'
import {
  getSubscriptions, addSubscription, updateSubscription, deleteSubscription,
} from '../lib/api'
import Modal from '../components/Modal'
import {
  formatDate, formatCurrency, generateId, today,
  SUBSCRIPTION_CATEGORIES, BILLING_CYCLES,
} from '../lib/utils'

// ---------------------------------------------------------------------------
// Days until a date
// ---------------------------------------------------------------------------
function daysUntil(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24))
}

function renewalBadge(dateStr, active) {
  if (!active) return { label: 'Inactive', cls: 'bg-[#1a1a1a] text-[#555] border border-[#2a2a2a]' }
  const days = daysUntil(dateStr)
  if (days === null) return { label: 'No date', cls: 'bg-[#1a1a1a] text-[#555] border border-[#2a2a2a]' }
  if (days < 0) return { label: 'Expired', cls: 'bg-red-500/10 text-red-400 border border-red-500/20' }
  if (days <= 7) return { label: `${days}d`, cls: 'bg-red-500/10 text-red-400 border border-red-500/20' }
  if (days <= 30) return { label: `${days}d`, cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' }
  return { label: formatDate(dateStr), cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' }
}

// ---------------------------------------------------------------------------
// Subscription form
// ---------------------------------------------------------------------------
function SubscriptionForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    category: 'Design Tools',
    cost: '',
    currency: 'EUR',
    billing_cycle: 'Monthly',
    next_renewal: '',
    url: '',
    notes: '',
    active: true,
    ...initial,
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (initial?.id) {
        await updateSubscription(initial.id, form)
      } else {
        await addSubscription({ ...form, id: generateId() })
      }
      onSave()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const fieldCls = 'w-full px-3 py-2 text-sm bg-[#0a0a0b] border border-[#2a2a2a] rounded-lg text-[#f0f0ed] placeholder-[#555] focus:outline-none focus:ring-2 focus:ring-[#d4d93f]/30 focus:border-[#d4d93f]/50'
  const labelCls = 'block text-xs text-[#6b6b6b] mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Name *</label>
        <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Figma, Adobe CC…" className={fieldCls} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className={fieldCls}>
            {SUBSCRIPTION_CATEGORIES.map(c => <option key={c} className="bg-[#0c0c14]">{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Billing Cycle</label>
          <select value={form.billing_cycle} onChange={e => set('billing_cycle', e.target.value)} className={fieldCls}>
            {BILLING_CYCLES.map(b => <option key={b} className="bg-[#0c0c14]">{b}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Cost</label>
          <input type="number" step="0.01" value={form.cost} onChange={e => set('cost', e.target.value)} placeholder="0.00" className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>Currency</label>
          <input value={form.currency} onChange={e => set('currency', e.target.value)} className={fieldCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Next Renewal Date</label>
        <input type="date" value={form.next_renewal} onChange={e => set('next_renewal', e.target.value)} className={fieldCls} />
      </div>

      <div>
        <label className={labelCls}>URL / Website</label>
        <input type="url" value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://…" className={fieldCls} />
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} className={fieldCls} />
      </div>

      <label className="flex items-center gap-2 text-sm text-[#f0f0ed] cursor-pointer">
        <input type="checkbox" checked={!!form.active} onChange={e => set('active', e.target.checked)} className="rounded accent-[#d4d93f]" />
        Active subscription
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#6b6b6b] hover:text-[#f0f0ed]">Cancel</button>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold font-display bg-[#d4d93f] hover:bg-[#bfc42e] text-[#0a0a0b] rounded-lg disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function SubscriptionsPage() {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setSubs(await getSubscriptions()) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!confirm('Delete this subscription?')) return
    setDeleting(id)
    await deleteSubscription(id)
    load()
    setDeleting(null)
  }

  async function handleToggleActive(sub) {
    await updateSubscription(sub.id, { active: !sub.active })
    load()
  }

  const active = subs.filter(s => s.active !== false && s.active !== 'FALSE')
  const monthlyTotal = active
    .filter(s => s.billing_cycle === 'Monthly')
    .reduce((sum, s) => sum + parseFloat(s.cost || 0), 0)
  const yearlyTotal = active
    .filter(s => s.billing_cycle === 'Yearly')
    .reduce((sum, s) => sum + parseFloat(s.cost || 0), 0)
  const expiringSoon = active.filter(s => { const d = daysUntil(s.next_renewal); return d !== null && d <= 14 && d >= 0 })

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <RefreshCw size={22} className="animate-spin text-[#d4d93f]" />
    </div>
  )

  if (error) return (
    <div className="p-8">
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-red-400">
        <p className="font-semibold mb-1">Failed to load</p>
        <p className="text-sm">{error}</p>
        <button onClick={load} className="mt-3 text-sm underline">Try again</button>
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#f0f0ed] tracking-tight">Subscriptions</h1>
          <p className="text-sm text-[#6b6b6b] mt-1">Track app costs, renewals &amp; expirations</p>
        </div>
        <button
          onClick={() => setModal({ mode: 'add' })}
          className="flex items-center gap-2 px-4 py-2 bg-[#d4d93f] hover:bg-[#bfc42e] text-[#0a0a0b] rounded-lg text-sm font-semibold transition-all"
        >
          <Plus size={15} /> Add Subscription
        </button>
      </div>

      {/* Summary cards */}
      {subs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Active', value: active.length, color: 'yellow' },
            { label: 'Monthly cost', value: formatCurrency(monthlyTotal), color: 'green' },
            { label: 'Yearly cost', value: formatCurrency(yearlyTotal), color: 'amber' },
            { label: 'Expiring soon', value: expiringSoon.length, color: expiringSoon.length > 0 ? 'red' : 'green' },
          ].map(({ label, value, color }) => {
            const cls = {
              yellow: 'text-[#d4d93f]',
              green:  'text-emerald-400',
              amber:  'text-amber-400',
              red:    'text-red-400',
            }[color]
            return (
              <div key={label} className="bg-[#0c0c14] border border-[#2a2a2a] rounded-xl px-4 py-3">
                <p className="text-xs text-[#555]">{label}</p>
                <p className={`text-xl font-display font-bold mt-0.5 tabular-nums ${cls}`}>{value}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Expiring soon alert */}
      {expiringSoon.length > 0 && (
        <div className="mb-5 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400">
          <AlertCircle size={15} />
          <span className="text-sm font-medium">{expiringSoon.length} subscription{expiringSoon.length > 1 ? 's' : ''} renewing within 14 days</span>
        </div>
      )}

      {/* Table */}
      {subs.length === 0 ? (
        <div className="text-center py-20 text-[#6b6b6b]">
          <Package size={38} className="mx-auto mb-3 text-[#2a2a2a]" />
          <p className="text-base font-medium text-[#f0f0ed] mb-1">No subscriptions yet</p>
          <p className="text-sm mb-4">Track your tools, apps and recurring services.</p>
          <button
            onClick={() => setModal({ mode: 'add' })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4d93f] text-[#0a0a0b] rounded-lg text-sm font-semibold hover:bg-[#bfc42e] transition-colors"
          >
            <Plus size={14} /> Add Subscription
          </button>
        </div>
      ) : (
        <div className="bg-[#0c0c14] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a] bg-[#111114] text-xs font-medium text-[#555] uppercase tracking-wide">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Cost</th>
                <th className="text-left px-4 py-3">Cycle</th>
                <th className="text-left px-4 py-3">Next Renewal</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {subs
                .sort((a, b) => {
                  // Active first, then by renewal date
                  const aActive = a.active !== false && a.active !== 'FALSE'
                  const bActive = b.active !== false && b.active !== 'FALSE'
                  if (aActive !== bActive) return aActive ? -1 : 1
                  return (a.next_renewal || '').localeCompare(b.next_renewal || '')
                })
                .map(sub => {
                  const isActive = sub.active !== false && sub.active !== 'FALSE'
                  const badge = renewalBadge(sub.next_renewal, isActive)
                  return (
                    <tr key={sub.id} className={`hover:bg-[#111114] transition-colors ${!isActive ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#f0f0ed]">{sub.name}</span>
                          {sub.url && (
                            <a href={sub.url} target="_blank" rel="noopener noreferrer" className="text-[#555] hover:text-[#d4d93f]">
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                        {sub.notes && <p className="text-xs text-[#555] mt-0.5 truncate max-w-[200px]">{sub.notes}</p>}
                      </td>
                      <td className="px-4 py-3 text-[#6b6b6b]">{sub.category}</td>
                      <td className="px-4 py-3 font-semibold text-[#f0f0ed] tabular-nums">
                        {sub.cost ? formatCurrency(sub.cost, sub.currency) : '—'}
                      </td>
                      <td className="px-4 py-3 text-[#6b6b6b]">{sub.billing_cycle}</td>
                      <td className="px-4 py-3 text-[#6b6b6b]">{sub.next_renewal ? formatDate(sub.next_renewal) : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => handleToggleActive(sub)}
                            title={isActive ? 'Mark inactive' : 'Mark active'}
                            className={`p-1.5 rounded transition-colors ${isActive ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-[#555] hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => setModal({ mode: 'edit', item: sub })}
                            className="p-1.5 text-[#555] hover:text-[#d4d93f] rounded hover:bg-[#d4d93f]/10 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id)}
                            disabled={deleting === sub.id}
                            className="p-1.5 text-[#555] hover:text-red-400 rounded hover:bg-red-500/10 transition-colors disabled:opacity-40"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          title={modal.mode === 'add' ? 'Add Subscription' : 'Edit Subscription'}
          onClose={() => setModal(null)}
        >
          <SubscriptionForm
            initial={modal.item}
            onSave={load}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}
