import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, CreditCard, AlertCircle, Clock, Plus,
  Search, ChevronRight, RefreshCw, CalendarDays, Package,
} from 'lucide-react'
import { getAccounts, getPayments, getMeetings, getSubscriptions } from '../lib/api'
import {
  formatDate, formatCurrency, paymentStatus,
  typeBadgeClass, TEAM_MEMBERS, ACCOUNT_TYPES,
} from '../lib/utils'

const F = 'px-3 py-2 text-sm border border-[#2a2a2a] rounded-lg bg-[#0a0a0b] text-[#f0f0ed] placeholder-[#555] focus:outline-none focus:ring-2 focus:ring-[#d4d93f]/30 focus:border-[#d4d93f]/50 transition-colors'

function StatCard({ label, value, sub, icon: Icon, color = 'yellow' }) {
  const colors = {
    yellow: 'bg-[#d4d93f]/10 text-[#d4d93f] border-[#d4d93f]/20',
    green:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red:    'bg-red-500/10 text-red-400 border-red-500/20',
    amber:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }
  return (
    <div className="bg-[#0c0c14] border border-[#2a2a2a] rounded-xl px-5 py-4 flex items-center gap-4 hover:border-[#383838] transition-colors">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold font-display text-[#f0f0ed] tabular-nums">{value}</p>
        <p className="text-xs text-[#6b6b6b]">{label}</p>
        {sub && <p className="text-xs text-[#6b6b6b] mt-0.5">{sub}</p>}
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
      className="bg-[#0c0c14] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#d4d93f]/30 hover:bg-[#111114] transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold font-display text-[#f0f0ed] truncate text-base group-hover:text-[#d4d93f] transition-colors">
            {account.name}
          </h3>
          <p className="text-xs text-[#6b6b6b] mt-0.5">
            Assigned to <span className="text-[#f0f0ed]">{account.assigned_to || '—'}</span>
          </p>
        </div>
        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeBadgeClass(account.type)}`}>
          {account.type}
        </span>
      </div>

      {platforms.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {platforms.map(p => (
            <span key={p} className="px-2 py-0.5 bg-[#111114] border border-[#2a2a2a] text-[#6b6b6b] text-xs rounded-full">
              {p}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-[#2a2a2a]">
        <span className="text-xs">
          {unpaidCount > 0
            ? <span className="text-amber-400 font-medium">{unpaidCount} unpaid invoice{unpaidCount > 1 ? 's' : ''}</span>
            : <span className="text-emerald-400">All paid</span>
          }
        </span>
        <span className="text-xs text-[#6b6b6b] flex items-center gap-1">
          Updated {formatDate(account.updated_at)}
          <ChevronRight size={11} className="text-[#2a2a2a] group-hover:text-[#d4d93f] transition-colors" />
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Meetings widget
// ---------------------------------------------------------------------------
function MeetingsWidget({ meetings, accounts, navigate }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const upcoming = meetings
    .filter(m => {
      if (!m.date) return false
      const d = new Date(m.date + 'T00:00:00')
      return d >= today
    })
    .sort((a, b) => {
      const diff = a.date.localeCompare(b.date)
      if (diff !== 0) return diff
      return (a.time || '').localeCompare(b.time || '')
    })
    .slice(0, 5)

  if (upcoming.length === 0) return null

  function daysLabel(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
    if (diff === 0) return <span className="text-[#d4d93f] font-semibold">Today</span>
    if (diff === 1) return <span className="text-amber-400">Tomorrow</span>
    return <span className="text-[#6b6b6b]">in {diff}d</span>
  }

  return (
    <div className="bg-[#0c0c14] border border-[#2a2a2a] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={15} className="text-[#d4d93f]" />
          <h2 className="text-sm font-semibold font-display text-[#f0f0ed]">Upcoming Meetings</h2>
        </div>
        <span className="text-xs text-[#555]">{upcoming.length} scheduled</span>
      </div>
      <div className="space-y-2">
        {upcoming.map(m => (
          <div
            key={m.id}
            onClick={() => { const acc = accounts.find(a => a.id === m.account_id); if (acc) navigate(`/account/${acc.id}?tab=Meetings`) }}
            className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[#111114] hover:bg-[#161616] cursor-pointer transition-colors group"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#f0f0ed] truncate group-hover:text-[#d4d93f] transition-colors">{m.title}</p>
              <p className="text-xs text-[#555] truncate">{m.account_name || '—'}{m.location ? ` · ${m.location}` : ''}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs">{daysLabel(m.date)}</p>
              {m.time && <p className="text-xs text-[#555]">{m.time}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Subscriptions renewal widget
// ---------------------------------------------------------------------------
function SubscriptionsWidget({ subs, navigate }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const expiring = subs
    .filter(s => {
      const isActive = s.active !== false && s.active !== 'FALSE'
      if (!isActive || !s.next_renewal) return false
      const d = new Date(s.next_renewal + 'T00:00:00')
      const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
      return diff >= 0 && diff <= 30
    })
    .sort((a, b) => a.next_renewal.localeCompare(b.next_renewal))
    .slice(0, 4)

  if (expiring.length === 0) return null

  return (
    <div className="bg-[#0c0c14] border border-[#2a2a2a] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package size={15} className="text-amber-400" />
          <h2 className="text-sm font-semibold font-display text-[#f0f0ed]">Renewals Due Soon</h2>
        </div>
        <button onClick={() => navigate('/subscriptions')} className="text-xs text-[#555] hover:text-[#d4d93f] flex items-center gap-1 transition-colors">
          View all <ChevronRight size={11} />
        </button>
      </div>
      <div className="space-y-2">
        {expiring.map(s => {
          const d = new Date(s.next_renewal + 'T00:00:00')
          const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
          const urgent = diff <= 7
          return (
            <div
              key={s.id}
              onClick={() => navigate('/subscriptions')}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[#111114] hover:bg-[#161616] cursor-pointer transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#f0f0ed] truncate">{s.name}</p>
                <p className="text-xs text-[#555]">{s.category} · {s.billing_cycle}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-xs font-semibold ${urgent ? 'text-red-400' : 'text-amber-400'}`}>
                  {diff === 0 ? 'Today' : `${diff}d`}
                </p>
                {s.cost && <p className="text-xs text-[#555]">{formatCurrency(s.cost, s.currency)}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [payments, setPayments] = useState([])
  const [meetings, setMeetings] = useState([])
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterMember, setFilterMember] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [accs, pays, mtgs, subscriptions] = await Promise.all([
        getAccounts(), getPayments(), getMeetings(), getSubscriptions(),
      ])
      setAccounts(accs); setPayments(pays); setMeetings(mtgs); setSubs(subscriptions)
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
      <RefreshCw size={22} className="animate-spin text-[#d4d93f]" />
    </div>
  )

  if (error) return (
    <div className="p-8">
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 text-red-400">
        <p className="font-semibold mb-1">Failed to load data</p>
        <p className="text-sm">{error}</p>
        <button onClick={load} className="mt-3 text-sm underline">Try again</button>
      </div>
    </div>
  )

  const showSidePanels = meetings.length > 0 || subs.some(s => {
    const isActive = s.active !== false && s.active !== 'FALSE'
    if (!isActive || !s.next_renewal) return false
    const d = new Date(s.next_renewal + 'T00:00:00')
    const now = new Date(); now.setHours(0, 0, 0, 0)
    return Math.ceil((d - now) / (1000 * 60 * 60 * 24)) <= 30
  })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#f0f0ed] tracking-tight">Dashboard</h1>
          <p className="text-sm text-[#6b6b6b] mt-1">All accounts at a glance</p>
        </div>
        <button
          onClick={() => navigate('/account/new')}
          className="flex items-center gap-2 px-4 py-2 bg-[#d4d93f] hover:bg-[#bfc42e] text-[#0a0a0b] rounded-lg text-sm font-semibold transition-all"
        >
          <Plus size={15} /> New Account
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Accounts"   value={accounts.length} icon={Users} color="yellow" />
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

      {/* Main layout: accounts grid + side panels */}
      <div className={`flex gap-6 ${showSidePanels ? 'items-start' : ''}`}>
        {/* Left: accounts */}
        <div className="flex-1 min-w-0">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
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
                className="px-3 py-2 text-sm text-[#555] hover:text-[#f0f0ed] underline">Clear</button>
            )}
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-[#6b6b6b]">
              {accounts.length === 0 ? (
                <>
                  <Users size={38} className="mx-auto mb-3 text-[#2a2a2a]" />
                  <p className="text-base font-medium text-[#f0f0ed] mb-1">No accounts yet</p>
                  <p className="text-sm mb-4">Add your first client or personal brand to get started.</p>
                  <button onClick={() => navigate('/account/new')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4d93f] text-[#0a0a0b] rounded-lg text-sm font-semibold hover:bg-[#bfc42e] transition-colors">
                    <Plus size={14} /> Add Account
                  </button>
                </>
              ) : (
                <>
                  <Search size={38} className="mx-auto mb-3 text-[#2a2a2a]" />
                  <p className="text-base font-medium text-[#f0f0ed] mb-1">No accounts match your filters</p>
                  <button onClick={() => { setSearch(''); setFilterType(''); setFilterMember('') }}
                    className="text-sm text-[#555] hover:text-[#f0f0ed] underline">Clear filters</button>
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

        {/* Right: side panels (meetings + renewals) */}
        {showSidePanels && (
          <div className="w-72 shrink-0 space-y-4">
            <MeetingsWidget meetings={meetings} accounts={accounts} navigate={navigate} />
            <SubscriptionsWidget subs={subs} navigate={navigate} />
          </div>
        )}
      </div>
    </div>
  )
}
