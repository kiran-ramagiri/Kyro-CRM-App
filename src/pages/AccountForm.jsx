import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { getAccounts, addAccount, updateAccount } from '../lib/api'
import {
  generateId, today, PLATFORMS, TEAM_MEMBERS, ACCOUNT_TYPES,
} from '../lib/utils'

const EMPTY_FORM = {
  name: '',
  type: 'Client',
  assigned_to: TEAM_MEMBERS[0],
  platforms: [],       // array while editing, joined to string on save
  retainer_scope: '',
  ig_handle: '',
  login_user: '',
  login_pass: '',
  notes: '',
  content_calendar_url: '',
}

function parsePlatforms(str) {
  if (!str) return []
  return str.split(',').map(p => p.trim()).filter(Boolean)
}

export default function AccountForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Load existing account when editing
  useEffect(() => {
    if (!isEdit) return
    getAccounts().then(accounts => {
      const acc = accounts.find(a => a.id === id)
      if (!acc) { setError('Account not found'); return }
      setForm({
        ...acc,
        platforms: parsePlatforms(acc.platforms),
      })
    }).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [id, isEdit])

  function set(k, v) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function togglePlatform(p) {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter(x => x !== p)
        : [...f.platforms, p],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        platforms: form.platforms.join(', '),
        updated_at: today(),
      }

      if (isEdit) {
        await updateAccount(id, payload)
        navigate(`/account/${id}`)
      } else {
        const newId = generateId()
        await addAccount({ ...payload, id: newId, created_at: today() })
        navigate(`/account/${newId}`)
      }
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  const fieldCls = 'w-full px-3 py-2 text-sm bg-[#0a0a0b] border border-[#2a2a2a] text-[#f0f0ed] placeholder-[#555] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4d93f]/30 focus:border-[#d4d93f]/50 transition-colors'
  const labelCls = 'block text-sm font-medium text-[#6b6b6b] mb-1.5'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0b]">
        <RefreshCw size={24} className="animate-spin text-[#d4d93f]" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto bg-[#0a0a0b] min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(isEdit ? `/account/${id}` : '/')}
          className="p-1.5 text-[#555] hover:text-[#f0f0ed] hover:bg-[#111114] rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0ed] font-display">
            {isEdit ? 'Edit Account' : 'New Account'}
          </h1>
          <p className="text-sm text-[#555] mt-0.5">
            {isEdit ? 'Update account details' : 'Add a new client or personal brand'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <section className="bg-[#0c0c14] rounded-xl border border-[#2a2a2a] p-6 space-y-4">
          <h2 className="text-xs font-display text-[#555] uppercase tracking-wide">Basic Info</h2>

          <div>
            <label className={labelCls}>Account Name *</label>
            <input
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Acme Corp or @johndoe"
              className={fieldCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className={fieldCls}>
                {ACCOUNT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Assigned To</label>
              <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} className={fieldCls}>
                {TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Instagram Handle</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm">@</span>
              <input
                value={form.ig_handle}
                onChange={e => set('ig_handle', e.target.value.replace('@', ''))}
                placeholder="username"
                className={`${fieldCls} pl-7`}
              />
            </div>
          </div>
        </section>

        {/* Platforms */}
        <section className="bg-[#0c0c14] rounded-xl border border-[#2a2a2a] p-6">
          <h2 className="text-xs font-display text-[#555] uppercase tracking-wide mb-3">Platforms</h2>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  form.platforms.includes(p)
                    ? 'bg-[#d4d93f] border-[#d4d93f] text-[#0a0a0b] font-semibold'
                    : 'bg-[#0a0a0b] border-[#2a2a2a] text-[#6b6b6b] hover:border-[#d4d93f]/40 hover:text-[#d4d93f]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        {/* Retainer Scope */}
        <section className="bg-[#0c0c14] rounded-xl border border-[#2a2a2a] p-6">
          <h2 className="text-xs font-display text-[#555] uppercase tracking-wide mb-3">Retainer Scope</h2>
          <textarea
            rows={4}
            value={form.retainer_scope}
            onChange={e => set('retainer_scope', e.target.value)}
            placeholder="Describe what's included in the retainer…"
            className={fieldCls}
          />
        </section>

        {/* Login Credentials */}
        <section className="bg-[#0c0c14] rounded-xl border border-[#2a2a2a] p-6 space-y-4">
          <h2 className="text-xs font-display text-[#555] uppercase tracking-wide">Login Credentials</h2>
          <p className="text-xs text-[#555] -mt-2">Stored in Google Sheet — visible only to team members with sheet access.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Username</label>
              <input
                value={form.login_user}
                onChange={e => set('login_user', e.target.value)}
                autoComplete="off"
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <input
                type="text"
                value={form.login_pass}
                onChange={e => set('login_pass', e.target.value)}
                autoComplete="off"
                className={fieldCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Content Calendar URL</label>
            <input
              type="url"
              value={form.content_calendar_url}
              onChange={e => set('content_calendar_url', e.target.value)}
              placeholder="https://calendar.google.com/…"
              className={fieldCls}
            />
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/account/${id}` : '/')}
            className="px-4 py-2 text-sm text-[#6b6b6b] hover:text-[#f0f0ed] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#d4d93f] hover:bg-[#bfc42e] text-[#0a0a0b] text-sm font-semibold font-display rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving && <RefreshCw size={14} className="animate-spin" />}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  )
}
