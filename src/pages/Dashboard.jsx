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

const F = 'px-3 py-2 text-sm border border-[#1a2d4e] rounded-lg bg-[#0c1428] text-[#dce8ff] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-colors'

function StatCard({ label, value, sub, icon: Icon, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red:    'bg-red-500/10 text-red-400 border-red-500/20',
    amber:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }
  return (
    <div className="bg-[#0c1428] border border-[#1a2d4e] rounded-xl px-5 py-4 flex items-center gap-4 hover:border-[#243d68] transition-colors">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#dce8ff] tabular-nums">{value}</p>
        <p className="text-xs text-[#4a6080]">{label}</p>
        {sub && <p className="text-xs text-[#4a6080] mt-0.5">{sub}</p>}
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
      className="bg-[#0c1428] border border-[#1a2d4e] rounded-xl p-5 hover:border-blue-500/40 hover:bg-[#0f1a35] transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#dce8ff] truncate text-base group-hover:text-blue-400 transition-colors">
            {account.name}
          </h3>
          <p className="text-xs text-[#4a6080] mt-0.5">
            Assigned to <span className="text-[#7a9cc0]">{account.assigned_to || '—'}</span>
          </p>
        </div>
        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeBadgeClass(account.type)}`}>
          {account.type}
        </span>
      </div>

      {platforms.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {platforms.map(p => (
            <span key={p} className="px-2 py-0.5 bg-[#0f1a35] border border-[#1a2d4e] text-[#7a9cc0] text-xs rounded-full">
              {p}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-[#1a2d4e]">
        <span className="text-xs">
          {unpaidCount > 0
            ? <span className="text-amber-400 font-medium">{unpaidCount} unpaid invoice{unpaidCount > 1 ? 's' : ''}</span>
            : <span className="text-emerald-400">All paid</span>
          }
        </span>
        <span className="text-xs text-[#4a6080] flex items-center gap-1">
          Updated {formatDate(account.updated_at)}
          <ChevronRight size={11} className="text-[#1a2d4e] group-hover:text-blue-400 transition-colors" />
        </span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterMember, setFilterMember] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [accs, pays] = await Promise.all([getAccounts(), getPayments()])
      setAccounts(accs); setPayments(pays)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const unpaidPayments  = payments.filter(p => !p.paid)
  const overduePayments = payments.filter(p => paymentStatus(p) === 'overdue')
  const dueSoonPayments = payments.filter(p => paymentStatus(p) === 'due-soon')
  const nextDue = unpaidPayments.filter(p => p.due_date).sort((a, b) => a.due_date.localeCompare(b.due_date))[0]
  const unpaidByAccount = payments.reduce((acc, p) => {
    if (!p.paid) acc[p.account_id] = (acc[p.account_id] || 0) + 1
    return acc
  }, {})

  const filtered = accounts.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterType && a.type !== filterType) return false
    if (filterMember && a.assigned_to !== filterMember) return false
    return true
  })

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen">
      <RefreshCw size={22} className="animate-spin text-blue-500" />
    </div>
  )

  if (error) return (
    <div className="p-8">
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-red-400">
        <p className="font-semibold mb-1">Failed to load data</p>
        <p className="text-sm">{error}</p>
        <button onClick={load} className="mt-3 text-sm underline">Try again</button>
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#dce8ff] tracking-tight">Dashboard</h1>
          <p className="text-sm text-[#4a6080] mt-1">All accounts at a glance</p>
        </div>
        <button
          onClick={() => navigate('/account/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all glow-blue-sm"
        >
          <Plus size={15} /> New Account
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Accounts"   value={accounts.length} icon={Users} color="blue" />
        <StatCard label="Active Clients"   value={accounts.filter(a => a.type === 'Client').length}
          sub={`${accounts.filter(a => a.type === 'Personal Brand').length} personal brands`} icon={Users} color="green" />
        <StatCard label="Unpaid Invoices"  value={unpaidPayments.length}
          sub={overduePayments.length > 0 ? `${overduePayments.length} overdue` : undefined}
          icon={CreditCard} color={overduePayments.length > 0 ? 'red' : 'amber'} />
        <StatCard label="Next Due"
          value={nextDue ? formatDate(nextDue.due_date) : 'None'}
          sub={nextDue ? formatCurrency(nextDue.amount, nextDue.currency) : undefined}
          icon={Clock} color="amber" />
      </div>

      {/* Alerts */}
      {(overduePayments.length > 0 || dueSoonPayments.length > 0) && (
        <div className="mb-6 space-y-2">
          {overduePayments.length > 0 && (
            <div
              className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 cursor-pointer hover:bg-red-500/15 transition-colors"
              onClick={() => navigate('/payments')}
            >
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">{overduePayments.length} overdue payment{overduePayments.length > 1 ? 's' : ''}</span>
                <span className="text-sm text-red-500/70">— {formatCurrency(overduePayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0))} outstanding</span>
              </div>
              <span className="text-xs text-red-500/70 flex items-center gap-1">View <ChevronRight size={11} /></span>
            </div>
          )}
          {dueSoonPayments.length > 0 && (
            <div
              className="flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 cursor-pointer hover:bg-amber-500/15 transition-colors"
              onClick={() => navigate('/payments')}
            >
              <div className="flex items-center gap-2 text-amber-400">
                <Clock size={16} />
                <span className="text-sm font-medium">{dueSoonPayments.length} payment{dueSoonPayments.length > 1 ? 's' : ''} due within 7 days</span>
                <span className="text-sm text-amber-500/70">— {formatCurrency(dueSoonPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0))}</span>
              </div>
              <span className="text-xs text-amber-500/70 flex items-center gap-1">View <ChevronRight size={11} /></span>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6080]" />
          <input type="text" placeholder="Search accounts…" value={search} onChange={e => setSearch(e.target.value)}
            className={`${F} w-full pl-9`} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className={F}>
          <option value="">All types</option>
          {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterMember} onChange={e => setFilterMember(e.target.value)} className={F}>
          <option value="">All team members</option>
          {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {(search || filterType || filterMember) && (
          <button onClick={() => { setSearch(''); setFilterType(''); setFilterMember('') }}
            className="px-3 py-2 text-sm text-[#4a6080] hover:text-[#dce8ff] underline">Clear</button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[#4a6080]">
          {accounts.length === 0 ? (
            <>
              <Users size={38} className="mx-auto mb-3 opacity-20" />
              <p className="text-base font-medium text-[#7a9cc0] mb-1">No accounts yet</p>
              <p className="text-sm mb-4">Add your first client or personal brand to get started.</p>
              <button onClick={() => navigate('/account/new')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors">
                <Plus size={14} /> Add Account
              </button>
            </>
          ) : (
            <>
              <Search size={38} className="mx-auto mb-3 opacity-20" />
              <p className="text-base font-medium text-[#7a9cc0] mb-1">No accounts match your filters</p>
              <button onClick={() => { setSearch(''); setFilterType(''); setFilterMember('') }}
                className="text-sm text-blue-400 underline">Clear filters</button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(account => (
            <AccountCard key={account.id} account={account}
              unpaidCount={unpaidByAccount[account.id] || 0} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  )
}
