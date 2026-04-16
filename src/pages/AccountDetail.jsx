import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit2, Eye, EyeOff, ExternalLink,
  Plus, Trash2, CheckCircle, Clock, AlertCircle, RefreshCw,
} from 'lucide-react'
import {
  getAccounts, getContent, getPayments,
  addContent, updateContent, deleteContent,
  addPayment, updatePayment, deletePayment,
  updateAccount,
} from '../lib/api'
import Modal from '../components/Modal'
import {
  formatDate, formatCurrency, paymentStatus, statusBadgeClass,
  typeBadgeClass, generateId, today,
  PLATFORMS, TEAM_MEMBERS, CONTENT_STATUSES, RECURRENCE_PERIODS,
  DAYS_OF_WEEK, ENTRY_TYPES, CONTENT_PILLARS, entryTypeBadgeClass,
} from '../lib/utils'

// ---------------------------------------------------------------------------
// Content form (inside modal)
// ---------------------------------------------------------------------------
function ContentForm({ initial, accountId, accountName, onSave, onClose }) {
  const [form, setForm] = useState({
    week: '1',
    day: 'Monday',
    platform: 'Instagram',
    entry_type: 'Post',
    content_pillar: 'Product Promotion',
    visual_direction: '',
    creative_url: '',
    caption_en: '',
    caption_hr: '',
    hashtags: '',
    status: 'Draft',
    notes: '',
    ...initial,
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (initial?.id) {
        await updateContent(initial.id, { ...form, updated_at: today() })
      } else {
        await addContent({ ...form, id: generateId(), account_id: accountId, account_name: accountName, updated_at: today() })
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
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Week</label>
          <select value={form.week} onChange={e => set('week', e.target.value)} className={fieldCls}>
            {['1','2','3','4','5'].map(w => <option key={w} value={w} className="bg-[#0c0c14]">Week {w}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Day</label>
          <select value={form.day} onChange={e => set('day', e.target.value)} className={fieldCls}>
            {DAYS_OF_WEEK.map(d => <option key={d} className="bg-[#0c0c14]">{d}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Platform</label>
          <select value={form.platform} onChange={e => set('platform', e.target.value)} className={fieldCls}>
            {PLATFORMS.map(p => <option key={p} className="bg-[#0c0c14]">{p}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Entry Type</label>
          <select value={form.entry_type} onChange={e => set('entry_type', e.target.value)} className={fieldCls}>
            {ENTRY_TYPES.map(t => <option key={t} className="bg-[#0c0c14]">{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Content Pillar</label>
          <select value={form.content_pillar} onChange={e => set('content_pillar', e.target.value)} className={fieldCls}>
            {CONTENT_PILLARS.map(p => <option key={p} className="bg-[#0c0c14]">{p}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Visual Direction</label>
        <input value={form.visual_direction} onChange={e => set('visual_direction', e.target.value)} placeholder="e.g. menu picture, behind-the-scenes video…" className={fieldCls} />
      </div>

      <div>
        <label className={labelCls}>Creative — Google Drive link</label>
        <input type="url" value={form.creative_url} onChange={e => set('creative_url', e.target.value)} placeholder="https://drive.google.com/…" className={fieldCls} />
      </div>

      <div>
        <label className={labelCls}>Caption (EN)</label>
        <textarea rows={3} value={form.caption_en} onChange={e => set('caption_en', e.target.value)} className={fieldCls} />
      </div>

      <div>
        <label className={labelCls}>Caption (HR)</label>
        <textarea rows={3} value={form.caption_hr} onChange={e => set('caption_hr', e.target.value)} className={fieldCls} />
      </div>

      <div>
        <label className={labelCls}>Hashtags</label>
        <textarea rows={2} value={form.hashtags} onChange={e => set('hashtags', e.target.value)} placeholder="#tag1 #tag2 #tag3" className={fieldCls} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className={fieldCls}>
            {CONTENT_STATUSES.map(s => <option key={s} className="bg-[#0c0c14]">{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Notes</label>
          <input value={form.notes} onChange={e => set('notes', e.target.value)} className={fieldCls} />
        </div>
      </div>

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
// Payment form (inside modal)
// ---------------------------------------------------------------------------
function PaymentForm({ initial, accountId, onSave, onClose }) {
  const [form, setForm] = useState({
    amount: '',
    currency: 'EUR',
    invoice_date: today(),
    due_date: '',
    paid: false,
    paid_date: '',
    recurring: false,
    recurrence_period: 'Monthly',
    assigned_to: TEAM_MEMBERS[0],
    notes: '',
    ...initial,
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (initial?.id) {
        await updatePayment(initial.id, form)
      } else {
        await addPayment({
          ...form,
          id: generateId(),
          account_id: accountId,
        })
      }
      onSave()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const fieldCls = 'w-full px-3 py-2 text-sm bg-[#0a0a0b] border border-[#2a2a2a] rounded-lg text-[#f0f0ed] placeholder-[#555] focus:outline-none focus:ring-2 focus:ring-[#d4d93f]/30 focus:border-[#d4d93f]/50'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#6b6b6b] mb-1">Amount *</label>
          <input required type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} className={fieldCls} />
        </div>
        <div>
          <label className="block text-xs text-[#6b6b6b] mb-1">Currency</label>
          <input value={form.currency} onChange={e => set('currency', e.target.value)} className={fieldCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#6b6b6b] mb-1">Invoice Date</label>
          <input type="date" value={form.invoice_date} onChange={e => set('invoice_date', e.target.value)} className={fieldCls} />
        </div>
        <div>
          <label className="block text-xs text-[#6b6b6b] mb-1">Due Date</label>
          <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className={fieldCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#6b6b6b] mb-1">Recurrence</label>
          <select value={form.recurrence_period} onChange={e => set('recurrence_period', e.target.value)} className={fieldCls}>
            {RECURRENCE_PERIODS.map(r => <option key={r} className="bg-[#0c0c14]">{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#6b6b6b] mb-1">Assigned To</label>
          <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} className={fieldCls}>
            {TEAM_MEMBERS.map(m => <option key={m} className="bg-[#0c0c14]">{m}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-[#f0f0ed] cursor-pointer">
          <input type="checkbox" checked={!!form.paid} onChange={e => set('paid', e.target.checked)} className="rounded accent-[#d4d93f]" />
          Paid
        </label>
        <label className="flex items-center gap-2 text-sm text-[#f0f0ed] cursor-pointer">
          <input type="checkbox" checked={!!form.recurring} onChange={e => set('recurring', e.target.checked)} className="rounded accent-[#d4d93f]" />
          Recurring
        </label>
      </div>
      {form.paid && (
        <div>
          <label className="block text-xs text-[#6b6b6b] mb-1">Paid Date</label>
          <input type="date" value={form.paid_date} onChange={e => set('paid_date', e.target.value)} className={fieldCls} />
        </div>
      )}
      <div>
        <label className="block text-xs text-[#6b6b6b] mb-1">Notes</label>
        <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} className={fieldCls} />
      </div>
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
// Tab: Overview
// ---------------------------------------------------------------------------
function OverviewTab({ account }) {
  const [showPass, setShowPass] = useState(false)
  const infoRow = (label, value) => (
    <div key={label} className="flex flex-col">
      <span className="text-xs text-[#555] uppercase tracking-wide font-display">{label}</span>
      <span className="text-sm text-[#f0f0ed] mt-0.5">{value || '—'}</span>
    </div>
  )

  const platforms = account.platforms
    ? account.platforms.split(',').map(p => p.trim()).filter(Boolean)
    : []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Basic Info */}
        <div className="bg-[#0c0c14] rounded-xl border border-[#2a2a2a] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#f0f0ed] font-display">Account Info</h3>
          {infoRow('Type', account.type)}
          {infoRow('Assigned To', account.assigned_to)}
          {infoRow('Instagram Handle', account.ig_handle)}
          <div className="flex flex-col">
            <span className="text-xs text-[#555] uppercase tracking-wide font-display">Platforms</span>
            {platforms.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {platforms.map(p => (
                  <span key={p} className="px-2 py-0.5 bg-[#111114] text-[#6b6b6b] text-xs rounded-full border border-[#2a2a2a]">{p}</span>
                ))}
              </div>
            ) : <span className="text-sm text-[#f0f0ed] mt-0.5">—</span>}
          </div>
        </div>

        {/* Right: Credentials + Calendar */}
        <div className="bg-[#0c0c14] rounded-xl border border-[#2a2a2a] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#f0f0ed] font-display">Login Credentials</h3>
          {infoRow('Username', account.login_user)}
          <div className="flex flex-col">
            <span className="text-xs text-[#555] uppercase tracking-wide font-display">Password</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-[#f0f0ed] font-mono">
                {account.login_pass
                  ? (showPass ? account.login_pass : '••••••••')
                  : '—'}
              </span>
              {account.login_pass && (
                <button
                  onClick={() => setShowPass(!showPass)}
                  className="text-[#555] hover:text-[#6b6b6b]"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[#555] uppercase tracking-wide font-display">Content Calendar</span>
            {account.content_calendar_url ? (
              <a
                href={account.content_calendar_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 flex items-center gap-1 text-sm text-[#d4d93f] hover:underline"
              >
                Open calendar <ExternalLink size={12} />
              </a>
            ) : <span className="text-sm text-[#f0f0ed] mt-0.5">—</span>}
          </div>
        </div>
      </div>

      {/* Retainer Scope */}
      {account.retainer_scope && (
        <div className="bg-[#0c0c14] rounded-xl border border-[#2a2a2a] p-5">
          <h3 className="text-sm font-semibold text-[#f0f0ed] font-display mb-2">Retainer Scope</h3>
          <p className="text-sm text-[#6b6b6b] whitespace-pre-wrap">{account.retainer_scope}</p>
        </div>
      )}

      {/* Meta */}
      <div className="text-xs text-[#555] flex gap-4">
        <span>Created {formatDate(account.created_at)}</span>
        <span>Updated {formatDate(account.updated_at)}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Content Calendar
// ---------------------------------------------------------------------------
const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

function ContentTab({ account, content, onRefresh }) {
  const [modal, setModal] = useState(null)
  const [filterWeek, setFilterWeek] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [expanded, setExpanded] = useState(null) // expanded row id
  const [deleting, setDeleting] = useState(null)

  const accountContent = content.filter(c => c.account_id === account.id)

  const weeks = [...new Set(accountContent.map(c => c.week).filter(Boolean))].sort((a,b) => Number(a)-Number(b))

  const filtered = accountContent.filter(c => {
    if (filterWeek && c.week !== filterWeek) return false
    if (filterStatus && c.status !== filterStatus) return false
    if (filterPlatform && c.platform !== filterPlatform) return false
    return true
  }).sort((a, b) => {
    const wDiff = Number(a.week) - Number(b.week)
    if (wDiff !== 0) return wDiff
    return DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
  })

  async function handleToggleStatus(item) {
    const next = { Draft: 'In Review', 'In Review': 'Published', Published: 'Draft' }
    await updateContent(item.id, { status: next[item.status] || 'Draft', updated_at: today() })
    onRefresh()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this content item?')) return
    setDeleting(id)
    await deleteContent(id)
    onRefresh()
    setDeleting(null)
  }

  const selCls = 'px-3 py-1.5 text-sm bg-[#0a0a0b] border border-[#2a2a2a] rounded-lg text-[#f0f0ed] focus:outline-none focus:ring-2 focus:ring-[#d4d93f]/30 focus:border-[#d4d93f]/50'

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select value={filterWeek} onChange={e => setFilterWeek(e.target.value)} className={selCls}>
          <option value="" className="bg-[#0c0c14]">All weeks</option>
          {weeks.map(w => <option key={w} value={w} className="bg-[#0c0c14]">Week {w}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selCls}>
          <option value="" className="bg-[#0c0c14]">All statuses</option>
          {CONTENT_STATUSES.map(s => <option key={s} className="bg-[#0c0c14]">{s}</option>)}
        </select>
        <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className={selCls}>
          <option value="" className="bg-[#0c0c14]">All platforms</option>
          {PLATFORMS.map(p => <option key={p} className="bg-[#0c0c14]">{p}</option>)}
        </select>
        <button
          onClick={() => setModal({ mode: 'add' })}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#d4d93f] hover:bg-[#bfc42e] text-[#0a0a0b] text-sm font-semibold font-display rounded-lg transition-colors"
        >
          <Plus size={15} /> Add Entry
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[#555] text-sm">No content entries yet.</div>
      ) : (
        <div className="bg-[#0c0c14] rounded-xl border border-[#2a2a2a] overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-[#2a2a2a] bg-[#111114] text-xs font-medium text-[#555] uppercase tracking-wide">
                <th className="text-left px-4 py-3 w-16">Week</th>
                <th className="text-left px-4 py-3 w-24">Day</th>
                <th className="text-left px-4 py-3 w-24">Platform</th>
                <th className="text-left px-4 py-3 w-20">Type</th>
                <th className="text-left px-4 py-3">Content Pillar</th>
                <th className="text-left px-4 py-3">Visual Direction</th>
                <th className="text-left px-4 py-3 w-20">Creative</th>
                <th className="text-left px-4 py-3 w-24">Status</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {filtered.map(item => (
                <>
                  <tr
                    key={item.id}
                    className="hover:bg-[#111114] transition-colors cursor-pointer"
                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  >
                    <td className="px-4 py-3 text-[#6b6b6b] font-medium">{item.week}</td>
                    <td className="px-4 py-3 text-[#6b6b6b]">{item.day}</td>
                    <td className="px-4 py-3 text-[#6b6b6b]">{item.platform}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${entryTypeBadgeClass(item.entry_type)}`}>
                        {item.entry_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6b6b6b]">{item.content_pillar}</td>
                    <td className="px-4 py-3 text-[#f0f0ed] max-w-[200px] truncate">{item.visual_direction}</td>
                    <td className="px-4 py-3">
                      {item.creative_url
                        ? <a href={item.creative_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-[#d4d93f] hover:underline text-xs"><ExternalLink size={12} /> View</a>
                        : <span className="text-[#555] text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); handleToggleStatus(item) }}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${statusBadgeClass(item.status)}`}
                        title="Click to advance status"
                      >
                        {item.status}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={e => { e.stopPropagation(); setModal({ mode: 'edit', item }) }}
                          className="p-1.5 text-[#555] hover:text-[#d4d93f] rounded hover:bg-[#d4d93f]/10 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                          disabled={deleting === item.id}
                          className="p-1.5 text-[#555] hover:text-red-400 rounded hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === item.id && (
                    <tr key={`${item.id}-exp`} className="bg-[#111114]">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {item.caption_en && (
                            <div>
                              <p className="text-xs text-[#555] uppercase font-display mb-1">Caption (EN)</p>
                              <p className="text-[#f0f0ed] whitespace-pre-wrap">{item.caption_en}</p>
                            </div>
                          )}
                          {item.caption_hr && (
                            <div>
                              <p className="text-xs text-[#555] uppercase font-display mb-1">Caption (HR)</p>
                              <p className="text-[#f0f0ed] whitespace-pre-wrap">{item.caption_hr}</p>
                            </div>
                          )}
                          {item.hashtags && (
                            <div>
                              <p className="text-xs text-[#555] uppercase font-display mb-1">Hashtags</p>
                              <p className="text-[#d4d93f] text-xs">{item.hashtags}</p>
                            </div>
                          )}
                          {item.notes && (
                            <div>
                              <p className="text-xs text-[#555] uppercase font-display mb-1">Notes</p>
                              <p className="text-[#6b6b6b]">{item.notes}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === 'add' ? 'Add Content Entry' : 'Edit Content Entry'} onClose={() => setModal(null)} size="lg">
          <ContentForm initial={modal.item} accountId={account.id} accountName={account.name} onSave={onRefresh} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Payments
// ---------------------------------------------------------------------------
function PaymentsTab({ account, payments, onRefresh }) {
  const [modal, setModal] = useState(null)
  const [toggling, setToggling] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const accountPayments = payments
    .filter(p => p.account_id === account.id)
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))

  async function handleTogglePaid(p) {
    setToggling(p.id)
    await updatePayment(p.id, {
      paid: !p.paid,
      paid_date: !p.paid ? today() : '',
    })
    onRefresh()
    setToggling(null)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this payment?')) return
    setDeleting(id)
    await deletePayment(id)
    onRefresh()
    setDeleting(null)
  }

  const total = accountPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0)
  const totalPaid = accountPayments.filter(p => p.paid).reduce((s, p) => s + parseFloat(p.amount || 0), 0)

  const statusIcon = (p) => {
    const s = paymentStatus(p)
    if (s === 'paid')     return <CheckCircle size={14} className="text-emerald-400" />
    if (s === 'overdue')  return <AlertCircle size={14} className="text-red-400" />
    if (s === 'due-soon') return <Clock size={14} className="text-amber-400" />
    return null
  }

  return (
    <div>
      {/* Summary */}
      {accountPayments.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Total Invoiced', value: formatCurrency(total) },
            { label: 'Total Paid', value: formatCurrency(totalPaid), green: true },
            { label: 'Outstanding', value: formatCurrency(total - totalPaid), red: total - totalPaid > 0 },
          ].map(({ label, value, green, red }) => (
            <div key={label} className="bg-[#0c0c14] rounded-xl border border-[#2a2a2a] px-4 py-3">
              <p className="text-xs text-[#555]">{label}</p>
              <p className={`text-lg font-display mt-0.5 ${green ? 'text-emerald-400' : red ? 'text-red-400' : 'text-[#f0f0ed]'}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setModal({ mode: 'add' })}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d4d93f] hover:bg-[#bfc42e] text-[#0a0a0b] text-sm font-semibold font-display rounded-lg transition-colors"
        >
          <Plus size={15} /> Add Payment
        </button>
      </div>

      {accountPayments.length === 0 ? (
        <div className="text-center py-12 text-[#555]">
          <p className="text-sm">No payments logged yet.</p>
        </div>
      ) : (
        <div className="bg-[#0c0c14] rounded-xl border border-[#2a2a2a] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a] bg-[#111114] text-xs font-medium text-[#555] uppercase tracking-wide">
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Invoice Date</th>
                <th className="text-left px-4 py-3">Due Date</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Recurrence</th>
                <th className="text-left px-4 py-3">Assigned</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {accountPayments.map(p => {
                const st = paymentStatus(p)
                const rowCls = st === 'overdue' ? 'bg-red-500/5' : st === 'due-soon' ? 'bg-amber-500/5' : ''
                return (
                  <tr key={p.id} className={`hover:bg-[#111114] transition-colors ${rowCls}`}>
                    <td className="px-4 py-3 font-semibold text-[#f0f0ed]">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="px-4 py-3 text-[#6b6b6b]">{formatDate(p.invoice_date)}</td>
                    <td className="px-4 py-3 text-[#6b6b6b]">{formatDate(p.due_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(p)}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(st)}`}>
                          {st === 'due-soon' ? 'Due Soon' : st.charAt(0).toUpperCase() + st.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6b6b6b]">
                      {p.recurring ? p.recurrence_period : 'One-time'}
                    </td>
                    <td className="px-4 py-3 text-[#6b6b6b]">{p.assigned_to}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => handleTogglePaid(p)}
                          disabled={toggling === p.id}
                          className={`p-1.5 rounded transition-colors disabled:opacity-40 ${p.paid ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-[#555] hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                          title={p.paid ? 'Mark unpaid' : 'Mark paid'}
                        >
                          <CheckCircle size={15} />
                        </button>
                        <button
                          onClick={() => setModal({ mode: 'edit', item: p })}
                          className="p-1.5 text-[#555] hover:text-[#d4d93f] rounded hover:bg-[#d4d93f]/10 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === p.id}
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
          title={modal.mode === 'add' ? 'Add Payment' : 'Edit Payment'}
          onClose={() => setModal(null)}
        >
          <PaymentForm
            initial={modal.item}
            accountId={account.id}
            onSave={onRefresh}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Notes
// ---------------------------------------------------------------------------
function NotesTab({ account, onRefresh }) {
  const [notes, setNotes] = useState(account.notes || '')
  const [calUrl, setCalUrl] = useState(account.content_calendar_url || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updateAccount(account.id, { notes, content_calendar_url: calUrl })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onRefresh()
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <label className="block text-xs text-[#6b6b6b] mb-2">Strategy / Notes</label>
        <textarea
          rows={10}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-[#0a0a0b] border border-[#2a2a2a] rounded-lg text-[#f0f0ed] placeholder-[#555] focus:outline-none focus:ring-2 focus:ring-[#d4d93f]/30 focus:border-[#d4d93f]/50 resize-none"
          placeholder="Add strategy notes, briefing info, or anything relevant…"
        />
      </div>
      <div>
        <label className="block text-xs text-[#6b6b6b] mb-2">Content Calendar URL</label>
        <input
          type="url"
          value={calUrl}
          onChange={e => setCalUrl(e.target.value)}
          placeholder="https://calendar.google.com/…"
          className="w-full px-3 py-2 text-sm bg-[#0a0a0b] border border-[#2a2a2a] rounded-lg text-[#f0f0ed] placeholder-[#555] focus:outline-none focus:ring-2 focus:ring-[#d4d93f]/30 focus:border-[#d4d93f]/50"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[#d4d93f] hover:bg-[#bfc42e] text-[#0a0a0b] text-sm font-semibold font-display rounded-lg disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Notes'}
        </button>
        {saved && <span className="text-sm text-emerald-400 flex items-center gap-1"><CheckCircle size={14} /> Saved</span>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main AccountDetail page
// ---------------------------------------------------------------------------
const TABS = ['Overview', 'Content', 'Payments', 'Notes']

export default function AccountDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('Overview')
  const [account, setAccount] = useState(null)
  const [content, setContent] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [accs, cont, pays] = await Promise.all([getAccounts(), getContent(), getPayments()])
      const acc = accs.find(a => a.id === id)
      if (!acc) { setError('Account not found'); return }
      setAccount(acc)
      setContent(cont)
      setPayments(pays)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0b]">
        <RefreshCw size={24} className="animate-spin text-[#d4d93f]" />
      </div>
    )
  }

  if (error || !account) {
    return (
      <div className="p-8 bg-[#0a0a0b] min-h-screen">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-red-400">
          <p className="font-semibold">Error</p>
          <p className="text-sm mt-1">{error || 'Account not found'}</p>
          <Link to="/" className="mt-3 inline-block text-sm underline">← Back to dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/')}
            className="mt-1 p-1.5 text-[#555] hover:text-[#f0f0ed] hover:bg-[#111114] rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-display text-[#f0f0ed]">{account.name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadgeClass(account.type)}`}>
                {account.type}
              </span>
            </div>
            <p className="text-sm text-[#6b6b6b] mt-0.5">
              Assigned to <span className="font-medium text-[#f0f0ed]">{account.assigned_to || '—'}</span>
              {account.ig_handle && <> · <span className="text-[#6b6b6b]">@{account.ig_handle}</span></>}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/account/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 border border-[#2a2a2a] hover:border-[#d4d93f]/40 hover:text-[#d4d93f] text-[#6b6b6b] text-sm font-medium rounded-lg transition-colors"
        >
          <Edit2 size={15} /> Edit Account
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#2a2a2a] mb-6">
        <nav className="flex gap-0" aria-label="Tabs">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t
                  ? 'border-[#d4d93f] text-[#d4d93f]'
                  : 'border-transparent text-[#555] hover:text-[#6b6b6b] hover:border-[#2a2a2a]'
              }`}
            >
              {t}
              {t === 'Content' && content.filter(c => c.account_id === id).length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-[#111114] text-[#555] text-xs rounded-full border border-[#2a2a2a]">
                  {content.filter(c => c.account_id === id).length}
                </span>
              )}
              {t === 'Payments' && payments.filter(p => p.account_id === id).length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-[#111114] text-[#555] text-xs rounded-full border border-[#2a2a2a]">
                  {payments.filter(p => p.account_id === id).length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === 'Overview' && <OverviewTab account={account} />}
      {tab === 'Content'  && <ContentTab  account={account} content={content}   onRefresh={load} />}
      {tab === 'Payments' && <PaymentsTab  account={account} payments={payments} onRefresh={load} />}
      {tab === 'Notes'    && <NotesTab     account={account} onRefresh={load} />}
    </div>
  )
}
