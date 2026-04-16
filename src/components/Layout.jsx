import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CreditCard, Plus } from 'lucide-react'

const NAV = [
  { to: '/',         label: 'Dashboard', icon: LayoutDashboard },
  { to: '/payments', label: 'Payments',  icon: CreditCard },
]

export default function Layout({ children }) {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-[#060b18]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-[#0c1428] border-r border-[#1a2d4e] flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-[#1a2d4e]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center glow-blue-sm">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <div>
              <p className="text-[#dce8ff] font-semibold text-base leading-none tracking-tight">Kyro</p>
              <p className="text-[#4a6080] text-xs mt-0.5">Content CRM</p>
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
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                    : 'text-[#7a9cc0] hover:text-[#dce8ff] hover:bg-[#0f1a35] border border-transparent'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* New Account button */}
        <div className="px-3 py-4 border-t border-[#1a2d4e]">
          <button
            onClick={() => navigate('/account/new')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all glow-blue-sm"
          >
            <Plus size={15} />
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
