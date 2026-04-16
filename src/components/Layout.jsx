import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CreditCard, Plus } from 'lucide-react'

const NAV = [
  { to: '/',         label: 'Dashboard', icon: LayoutDashboard },
  { to: '/payments', label: 'Payments',  icon: CreditCard },
]

export default function Layout({ children }) {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-slate-900 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <div>
              <p className="text-white font-semibold text-base leading-none">Kyro</p>
              <p className="text-slate-400 text-xs mt-0.5">Content CRM</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* New Account button */}
        <div className="px-3 py-4 border-t border-slate-700">
          <button
            onClick={() => navigate('/account/new')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            New Account
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
