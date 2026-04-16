import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle, Clock, CheckCircle, Plus, RefreshCw,
  ChevronUp, ChevronDown, Search,
} from 'lucide-react'
import { getAccounts, getPayments, addPayment, updatePayment, deletePayment } from '../lib/api'
import Modal from '../components/Modal'
import {
  formatDate, formatCurrency, paymentStatus, statusBadgeClass,
  generateId, today, TEAM_MEMBERS, RECURRENCE_PERIODS,
} from '../lib/utils'

// ---------------------------------------------------------------------------
// Add payment modal form
// ---------------------------------------------------------------------------
function AddPaymentModal({ accounts, onSave, onClose }) {
  const [form, setForm] = useState({
    account_id: accounts[0]?.id || '',
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
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const fieldCls = 'w-full px-3 py-2 text-sm bg-[#0a0a0b] border border-[#2a2a2a] rounded-lg text-[#f0f0ed] placeholder-[#555] focus:outline-none focus:ring-2 focus:ring-[#d4d93f]/30 focus:border-[#d4d93f]/50'

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await addPayment({ ...form, id: generateId() })
      onSave()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Account *</label>
        <select required value={form.account_id} onChange={e => set('account_id', e.target.value)} className={fieldCls}>
          <option value="">Select account…</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Amount *</label>
          <input required type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} className={fieldCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Currency</label>
          <input value={form.currency} onChange={e => set('currency', e.target.value)} className={fieldCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Invoice Date</label>
          <input type="date" value={form.invoice_date} onChange={e => set('invoice_date', e.target.value)} className={fieldCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Due Date</label>
          <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className={fieldCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Recurrence</label>
          <select value={form.recurrence_period} onChange={e => set('recurrence_period', e.target.value)} className={fieldCls}>
            {RECURRENCE_PERIODS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Assigned To</label>
          <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} className={fieldCls}>
            {TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-[#f0f0ed] cursor-pointer">
          <input type="checkbox" checked={!!form.paid} onChange={e => set('paid', e.target.checked)} className="rounded accent-[#d4d93f]" />
          Already Paid
        </label>
        <label className="flex items-center gap-2 text-sm text-[#f0f0ed] cursor-pointer">
          <input type="checkbox" checked={!!form.recurring} onChange={e => set('recurring', e.target.checked)} className="rounded accent-[#d4d93f]" />
          Recurring
        </label>
      </div>
      {form.paid && (
        <div>
          <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Paid Date</label>
          <input type="date" value={form.paid_date} onChange={e => set('paid_date', e.target.value)} className={fieldCls} />
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Notes</label>
        <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} className={fieldCls} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#6b6b6b] hover:text-[#f0f0ed]">Cancel</button>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold font-display bg-[#d4d93f] hover:bg-[#bfc42e] text-[#0a0a0b] rounded-lg disabled:opacity-50">
          {saving ? 'Saving…' : 'Add Payment'}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Sort helper
// ---------------------------------------------------------------------------
function SortButton({ col, label, current, dir, onClick }) {
  const active = current === col
  return (
    <button onClick={() => onClick(col)} className="flex items-center gap-0.5 group text-[#555] hover:text-[#f0f0ed]">
      {label || col}
      <span className="ml-1 opacity-40 group-hover:opacity-80">
        {active && dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function PaymentsPage() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMember, setFilterMember] = useState('')

  // Sort
  const [sortCol, setSortCol] = useState('due_date')
  const [sortDir, setSortDir] = useState('asc')

  const [toggling, setToggling] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [accs, pays] = await Promise.all([getAccounts(), getPayments()])
      setAccounts(accs)
      setPayments(pays)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Build lookup
  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a]))

  // Enrich payments with account name + computed status
  const enriched = payments.map(p => ({
    ...p,
    accountName: accountMap[p.account_id]?.name || 'Unknown',
    _status: paymentStatus(p),
  }))

  // Alerts
  const overdue  = enriched.filter(p => p._status === 'overdue')
  const dueSoon  = enriched.filter(p => p._status === 'due-soon')

  // Filter
  const filtered = enriched.filter(p => {
    if (search && !p.accountName.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus) {
      if (filterStatus === 'paid'     && p._status !== 'paid')     return false
      if (filterStatus === 'unpaid'   && p._status !== 'unpaid')   return false
      if (filterStatus === 'overdue'  && p._status !== 'overdue')  return false
      if (filterStatus === 'due-soon' && p._status !== 'due-soon') return false
    }
    if (filterMember && p.assigned_to !== filterMember) return false
    return true
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let av = a[sortCol] ?? ''
    let bv = b[sortCol] ?? ''
    if (sortCol === 'amount') { av = parseFloat(av) || 0; bv = parseFloat(bv) || 0 }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ?  1 : -1
    return 0
  })

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  async function handleTogglePaid(p) {
    setToggling(p.id)
    await updatePayment(p.id, { paid: !p.paid, paid_date: !p.paid ? today() : '' })
    load()
    setToggling(null)
  }

  // Summary stats
  const totalInvoiced  = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0)
  const totalPaid      = payments.filter(p => p.paid).reduce((s, p) => s + parseFloat(p.amount || 0), 0)
  const totalOutstanding = totalInvoiced - totalPaid

  const statusIcon = (s) => {
    if (s === 'paid')     return <CheckCircle size={13} className="text-emerald-400" />
    if (s === 'overdue')  return <AlertCircle size={13} className="text-red-400" />
    if (s === 'due-soon') return <Clock size={13} className="text-amber-400" />
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0b]">
        <RefreshCw size={24} className="animate-spin text-[#d4d93f]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 bg-[#0a0a0b] min-h-screen">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-red-400">
          <p className="font-semibold">Failed to load payments</p>
          <p className="text-sm mt-1">{error}</p>
          <button onClick={load} className="mt-3 text-sm underline text-[#555] hover:text-[#f0f0ed]">Try again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#f0f0ed]">Payments</h1>
          <p className="text-sm text-[#6b6b6b] mt-1">Full invoice ledger across all accounts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#d4d93f] hover:bg-[#bfc42e] text-[#0a0a0b] rounded-lg text-sm font-semibold font-display transition-colors"
        >
          <Plus size={16} /> New Payment
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Invoiced', value: formatCurrency(totalInvoiced), color: 'text-[#f0f0ed]' },
          { label: 'Total Paid',     value: formatCurrency(totalPaid),      color: 'text-emerald-400' },
          { label: 'Outstanding',    value: formatCurrency(totalOutstanding), color: totalOutstanding > 0 ? 'text-red-400' : 'text-[#f0f0ed]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#0c0c14] rounded-xl border border-[#2a2a2a] px-5 py-4">
            <p className="text-xs text-[#6b6b6b] mb-1">{label}</p>
            <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(overdue.length > 0 || dueSoon.length > 0) && (
        <div className="space-y-2 mb-6">
          {overdue.length > 0 && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">
                {overdue.length} overdue payment{overdue.length > 1 ? 's' : ''}
              </span>
              <span className="text-sm text-red-400/70">
                — {formatCurrency(overdue.reduce((s, p) => s + parseFloat(p.amount || 0), 0))} total
              </span>
            </div>
          )}
          {dueSoon.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400">
              <Clock size={16} />
              <span className="text-sm font-medium">
                {dueSoon.length} payment{dueSoon.length > 1 ? 's' : ''} due within 7 days
              </span>
              <span className="text-sm text-amber-400/70">
                — {formatCurrency(dueSoon.reduce((s, p) => s + parseFloat(p.amount || 0), 0))}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
          <input
            type="text"
            placeholder="Search by account…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#0a0a0b] border border-[#2a2a2a] rounded-lg text-[#f0f0ed] placeholder-[#555] focus:outline-none focus:ring-2 focus:ring-[#d4d93f]/30 focus:border-[#d4d93f]/50"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm bg-[#0a0a0b] border border-[#2a2a2a] rounded-lg text-[#f0f0ed] focus:outline-none focus:ring-2 focus:ring-[#d4d93f]/30 focus:border-[#d4d93f]/50"
        >
          <option value="">All statuses</option>
          <option value="overdue">Overdue</option>
          <option value="due-soon">Due Soon</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
        </select>
        <select
          value={filterMember}
          onChange={e => setFilterMember(e.target.value)}
          className="px-3 py-2 text-sm bg-[#0a0a0b] border border-[#2a2a2a] rounded-lg text-[#f0f0ed] focus:outline-none focus:ring-2 focus:ring-[#d4d93f]/30 focus:border-[#d4d93f]/50"
        >
          <option value="">All team members</option>
          {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {(search || filterStatus || filterMember) && (
          <button
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterMember('') }}
            className="px-3 py-2 text-sm text-[#555] hover:text-[#f0f0ed] underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="text-center py-20 text-[#555]">
          <p className="text-sm">No payments found.</p>
        </div>
      ) : (
        <div className="bg-[#0c0c14] rounded-xl border border-[#2a2a2a] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#111114] text-xs font-medium text-[#555] uppercase tracking-wide border-b border-[#2a2a2a]">
                <th className="text-left px-4 py-3">
                  <SortButton col="accountName" label="Account" current={sortCol} dir={sortDir} onClick={toggleSort} />
                </th>
                <th className="text-left px-4 py-3">
                  <SortButton col="amount" label="Amount" current={sortCol} dir={sortDir} onClick={toggleSort} />
                </th>
                <th className="text-left px-4 py-3">
                  <SortButton col="invoice_date" label="Invoice Date" current={sortCol} dir={sortDir} onClick={toggleSort} />
                </th>
                <th className="text-left px-4 py-3">
                  <SortButton col="due_date" label="Due Date" current={sortCol} dir={sortDir} onClick={toggleSort} />
                </th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Recurrence</th>
                <th className="text-left px-4 py-3">
                  <SortButton col="assigned_to" label="Assigned To" current={sortCol} dir={sortDir} onClick={toggleSort} />
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {sorted.map(p => {
                const rowCls = p._status === 'overdue'
                  ? 'bg-red-500/5 hover:bg-[#111114]'
                  : p._status === 'due-soon'
                  ? 'bg-amber-500/5 hover:bg-[#111114]'
                  : 'hover:bg-[#111114]'
                return (
                  <tr key={p.id} className={`transition-colors ${rowCls}`}>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/account/${p.account_id}`)}
                        className="font-medium text-[#f0f0ed] hover:text-[#d4d93f] hover:underline text-left"
                      >
                        {p.accountName}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#f0f0ed]">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="px-4 py-3 text-[#6b6b6b]">{formatDate(p.invoice_date)}</td>
                    <td className="px-4 py-3 text-[#6b6b6b]">{formatDate(p.due_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(p._status)}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(p._status)}`}>
                          {p._status === 'due-soon' ? 'Due Soon' : p._status.charAt(0).toUpperCase() + p._status.slice(1)}
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
                          title={p.paid ? 'Mark unpaid' : 'Mark paid'}
                          className={`p-1.5 rounded transition-colors disabled:opacity-40 ${
                            p.paid
                              ? 'text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-[#555] hover:text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        >
                          <CheckCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-[#111114] border-t border-[#2a2a2a] text-xs text-[#555]">
            {sorted.length} payment{sorted.length !== 1 ? 's' : ''}
            {filtered.length !== payments.length && ` (filtered from ${payments.length})`}
          </div>
        </div>
      )}

      {/* Add payment modal */}
      {showAddModal && (
        <Modal title="New Payment" onClose={() => setShowAddModal(false)} size="md">
          <AddPaymentModal
            accounts={accounts}
            onSave={load}
            onClose={() => setShowAddModal(false)}
          />
        </Modal>
      )}
    </div>
  )
}
