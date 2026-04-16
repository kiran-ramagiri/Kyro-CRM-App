import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, CreditCard, AlertCircle, Clock, Plus,
  Search, ChevronRight, RefreshCw,
} from 'lucide-react'
import { getAccounts, getPayments } from '../lib/api'
import {
  formatDate, formatCurrency, paymentStatus,
  typeBadgeClass, TEAM_MEMBERS, ACCOUNT_TYPES,
} from '../lib/utils'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StatCard({ label, value, sub, icon: Icon, color = 'violet' }) {
  const colors = {
    violet: 'bg-violet-50 text-violet-600',
    green:  'bg-green-50 text-green-600',
    red:    'bg-red-50 text-red-600',
    amber:  'bg-amber-50 text-amber-600',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function AccountCard({ account, unpaidCount, navigate }) {
  const platforms = account.platforms
    ? account.platforms.split(',').map(p => p.trim()).filter(Boolean)
    : []

  return (
    <div
      onClick={() => navigate(`/account/${account.id}`)}
      className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-violet-200 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate text-base group-hover:text-violet-700 transition-colors">
            {account.name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Assigned to <span className="font-medium text-slate-700">{account.assigned_to || '—'}</span>
          </p>
        </div>
        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeBadgeClass(account.type)}`}>
          {account.type}
        </span>
      </div>

      {/* Platforms */}
      {platforms.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {platforms.map(p => (
            <span key={p} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
              {p}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <span className="text-xs text-slate-400">
          {unpaidCount > 0
            ? <span className="text-amber-600 font-medium">{unpaidCount} unpaid invoice{unpaidCount > 1 ? 's' : ''}</span>
            : <span className="text-green-600">All paid</span>
          }
        </span>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          Updated {formatDate(account.updated_at)}
          <ChevronRight size={12} className="text-slate-300 group-hover:text-violet-500 transition-colors" />
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterMember, setFilterMember] = useState('')

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

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const unpaidPayments = payments.filter(p => !p.paid)
  const overduePayments = payments.filter(p => paymentStatus(p) === 'overdue')
  const dueSoonPayments = payments.filter(p => paymentStatus(p) === 'due-soon')

  const nextDue = unpaidPayments
    .filter(p => p.due_date)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0]

  // Per-account unpaid count
  const unpaidByAccount = payments.reduce((acc, p) => {
    if (!p.paid) acc[p.account_id] = (acc[p.account_id] || 0) + 1
    return acc
  }, {})

  // Filtered accounts
  const filtered = accounts.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterType && a.type !== filterType) return false
    if (filterMember && a.assigned_to !== filterMember) return false
    return true
  })

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <RefreshCw size={24} className="animate-spin text-violet-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700">
          <p className="font-semibold mb-1">Failed to load data</p>
          <p className="text-sm">{error}</p>
          <button onClick={load} className="mt-3 text-sm underline">Try again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">All accounts at a glance</p>
        </div>
        <button
          onClick={() => navigate('/account/new')}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Account
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Accounts"
          value={accounts.length}
          icon={Users}
          color="violet"
        />
        <StatCard
          label="Active Clients"
          value={accounts.filter(a => a.type === 'Client').length}
          sub={`${accounts.filter(a => a.type === 'Personal Brand').length} personal brands`}
          icon={Users}
          color="green"
        />
        <StatCard
          label="Unpaid Invoices"
          value={unpaidPayments.length}
          sub={overduePayments.length > 0 ? `${overduePayments.length} overdue` : undefined}
          icon={CreditCard}
          color={overduePayments.length > 0 ? 'red' : 'amber'}
        />
        <StatCard
          label="Next Due"
          value={nextDue ? formatDate(nextDue.due_date) : 'None'}
          sub={nextDue ? formatCurrency(nextDue.amount, nextDue.currency) : undefined}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Payment alerts */}
      {(overduePayments.length > 0 || dueSoonPayments.length > 0) && (
        <div className="mb-6 space-y-2">
          {overduePayments.length > 0 && (
            <div
              className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-red-100 transition-colors"
              onClick={() => navigate('/payments')}
            >
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle size={17} />
                <span className="text-sm font-medium">
                  {overduePayments.length} overdue payment{overduePayments.length > 1 ? 's' : ''}
                </span>
                <span className="text-sm text-red-500">
                  — {formatCurrency(overduePayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0))} outstanding
                </span>
              </div>
              <span className="text-xs text-red-500 flex items-center gap-1">View <ChevronRight size={12} /></span>
            </div>
          )}
          {dueSoonPayments.length > 0 && (
            <div
              className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 cursor-pointer hover:bg-amber-100 transition-colors"
              onClick={() => navigate('/payments')}
            >
              <div className="flex items-center gap-2 text-amber-700">
                <Clock size={17} />
                <span className="text-sm font-medium">
                  {dueSoonPayments.length} payment{dueSoonPayments.length > 1 ? 's' : ''} due within 7 days
                </span>
                <span className="text-sm text-amber-500">
                  — {formatCurrency(dueSoonPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0))}
                </span>
              </div>
              <span className="text-xs text-amber-500 flex items-center gap-1">View <ChevronRight size={12} /></span>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search accounts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white text-slate-700"
        >
          <option value="">All types</option>
          {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          value={filterMember}
          onChange={e => setFilterMember(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white text-slate-700"
        >
          <option value="">All team members</option>
          {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        {(search || filterType || filterMember) && (
          <button
            onClick={() => { setSearch(''); setFilterType(''); setFilterMember('') }}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Account grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          {accounts.length === 0 ? (
            <>
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium mb-1">No accounts yet</p>
              <p className="text-sm mb-4">Add your first client or personal brand to get started.</p>
              <button
                onClick={() => navigate('/account/new')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
              >
                <Plus size={15} /> Add Account
              </button>
            </>
          ) : (
            <>
              <Search size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium mb-1">No accounts match your filters</p>
              <button onClick={() => { setSearch(''); setFilterType(''); setFilterMember('') }} className="text-sm text-violet-600 underline">
                Clear filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(account => (
            <AccountCard
              key={account.id}
              account={account}
              unpaidCount={unpaidByAccount[account.id] || 0}
              navigate={navigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
