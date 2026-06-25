'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Calculator, BookOpen, Users, FileText,
  Wallet, BarChart3, Settings, UserCog, LogOut, Plane, X,
  PanelLeftClose, PanelLeftOpen, Receipt,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calculator', label: 'Umrah Calculator', icon: Calculator },
  { href: '/bookings', label: 'Bookings', icon: BookOpen },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/custom-invoices', label: 'Custom Invoices', icon: Receipt },
  { href: '/accounts', label: 'Accounts', icon: Wallet },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings/visa', label: 'Settings', icon: Settings },
  { href: '/users', label: 'Users & Staff', icon: UserCog },
]

interface SidebarProps {
  companyName: string
  open: boolean
  onClose: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export default function Sidebar({ companyName, open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/settings/visa') return pathname.startsWith('/settings')
    return pathname === href
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-50 flex flex-col',
          'bg-navy text-white transition-all duration-300',
          'lg:translate-x-0 lg:z-10',
          open ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-[72px]' : 'w-[272px]'
        )}
      >
        {/* Logo / Brand */}
        <div className={cn(
          'flex items-center border-b border-white/10 flex-shrink-0',
          collapsed ? 'flex-col gap-2 px-2 py-4' : 'gap-3 px-4 py-4'
        )}>
          <div className="w-16 h-16 rounded-xl bg-transparent flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="Umrah Dashboard" className="w-full h-full object-contain" />
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate leading-tight">Umrah Dashboard</p>
              <p className="text-[11px] text-white/50 leading-tight">Demo Account</p>
            </div>
          )}

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'hidden lg:flex items-center justify-center rounded-lg transition-colors',
              'text-white/50 hover:text-white hover:bg-white/10',
              collapsed ? 'w-8 h-8' : 'w-8 h-8 ml-auto flex-shrink-0'
            )}
          >
            {collapsed
              ? <PanelLeftOpen className="w-4 h-4" />
              : <PanelLeftClose className="w-4 h-4" />
            }
          </button>

          {/* Mobile close button */}
          <button
            className="lg:hidden text-white/60 hover:text-white ml-auto"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className={cn(
          'flex-1 overflow-y-auto py-3 space-y-0.5',
          collapsed ? 'px-1.5' : 'px-3'
        )}>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center rounded-lg text-sm font-medium transition-all duration-150',
                collapsed
                  ? 'justify-center px-0 py-2.5'
                  : 'gap-3 px-3 py-2.5',
                isActive(href)
                  ? 'bg-gold-gradient text-navy font-semibold'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className={cn('py-3 border-t border-white/10', collapsed ? 'px-1.5' : 'px-3')}>
          <form action={logout}>
            <button
              type="submit"
              title={collapsed ? 'Sign Out' : undefined}
              className={cn(
                'w-full flex items-center rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all',
                collapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2.5'
              )}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
