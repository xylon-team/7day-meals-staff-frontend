'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Shield,
  UserSquare2,
  Utensils,
  CalendarDays,
  Tags,
  Package,
  Truck,
  ClipboardList,
  BadgeCheck,
  Wallet,
  BarChart3,
  List,
  Settings,
  LogOut,
  Menu,
  Bell,
  Search,
  ChevronDown,
  User as UserIcon,
  X,
  Loader2,
  ShoppingBag,
} from 'lucide-react'
import { useUserStore } from '@/store/user-store'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<{ size: number; className?: string }>
  /**
   * Permission module code required for this nav item to be visible.
   * e.g. "inventory_item", "supplier", "role"
   * If omitted, the item is visible to all authenticated users.
   */
  permissionCode?: string
  /**
   * Specific action required (defaults to checking ANY action for the module).
   * Use "view" to only show when the user can view, etc.
   */
  permissionAction?: 'add' | 'change' | 'delete' | 'view'
}

interface NavSection {
  label: string
  /**
   * For Admin users we use the legacy role-name whitelist.
   * For staff the section is shown if at least one of its items is visible.
   */
  adminOnly?: boolean
  /** If true, this section is always visible to every authenticated user. */
  alwaysVisible?: boolean
  items: NavItem[]
}

// ---------------------------------------------------------------------------
// Navigation config
// Each item declares which permission module (and optionally action) it needs.
// ---------------------------------------------------------------------------

const navConfig: NavSection[] = [
  {
    label: 'General',
    alwaysVisible: true,
    items: [
      {
        name: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
        // Dashboard is always visible — no permissionCode
      },
    ],
  },
  {
    label: 'User Management',
    adminOnly: true,
    items: [
      {
        name: 'Roles & Users',
        path: '/users',
        icon: Users,
        permissionCode: 'role',
      },
      {
        name: 'Permissions',
        path: '/roles',
        icon: Shield,
        permissionCode: 'permission_assign',
      },
      {
        name: 'Customers',
        path: '/customers',
        icon: UserSquare2,
        permissionCode: 'customer',
      },
    ],
  },
  {
    label: 'Meal Management',
    items: [
      {
        name: 'Meals',
        path: '/meals',
        icon: Utensils,
        permissionCode: 'meal_item',
      },
      {
        name: 'Meal Plans',
        path: '/meal-plans',
        icon: CalendarDays,
        permissionCode: 'meal_package',
      },
      {
        name: 'Promotions',
        path: '/promotions',
        icon: Tags,
        permissionCode: 'promotion',
      },
    ],
  },
  {
    label: 'Order Management',
    items: [
      {
        name: 'Orders',
        path: '/orders',
        icon: ShoppingBag,
        permissionCode: 'orders',
      },
    ],
  },
  {
    label: 'Inventory',
    items: [
      {
        name: 'Inventory',
        path: '/inventory',
        icon: Package,
        permissionCode: 'inventory_item',
      },
      {
        name: 'Suppliers',
        path: '/suppliers',
        icon: Truck,
        permissionCode: 'supplier',
      },
      {
        name: 'Supply Requests',
        path: '/supply-requests',
        icon: ClipboardList,
        permissionCode: 'supply_request',
      },
    ],
  },
  {
    label: 'Staff',
    items: [
      {
        name: 'Staff Members',
        path: '/staff',
        icon: BadgeCheck,
        permissionCode: 'staff',
      },
      {
        name: 'Salary Management',
        path: '/salary',
        icon: Wallet,
        permissionCode: 'staff',
      },
    ],
  },
  {
    label: 'System',
    adminOnly: true,
    items: [
      {
        name: 'Reports',
        path: '/reports',
        icon: BarChart3,
        permissionCode: 'analysis_report',
      },
      {
        name: 'Logs',
        path: '/logs',
        icon: List,
        permissionCode: 'logs',
      },
      {
        name: 'Settings',
        path: '/settings',
        icon: Settings,
        permissionCode: 'system_settings',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Permission helpers (pure functions — no hooks, safe to call anywhere)
// ---------------------------------------------------------------------------

/**
 * Checks if a user's permission array grants access to a module/action.
 * Admins always return true.
 */
function checkPermission(
  permissions: string[] | undefined,
  role: string,
  code?: string,
  action?: string
): boolean {
  // Admins see everything
  if (role === 'Admin') return true
  // Items without a permission code are always visible
  if (!code) return true
  // Permissions not yet loaded — hide the item (safe default)
  if (!permissions) return false

  if (action) {
    return permissions.includes(`${code}_${action}`)
  }
  // Any action for this module is enough to show the nav item
  return permissions.some((p) => p.startsWith(`${code}_`))
}

// ---------------------------------------------------------------------------
// Layout component
// ---------------------------------------------------------------------------

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useUserStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isProfileOpen, setProfileOpen] = useState(false)

  // Don't show layout on login or root page
  if (!user || pathname === '/' || pathname === '/login') {
    return <>{children}</>
  }

  const isAdmin = user.role === 'Admin'
  const permissions = user.permissions

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const getPageTitle = () => {
    if (pathname === '/profile') return 'My Profile'
    const allItems = navConfig.flatMap((c) => c.items)
    const item = allItems.find((i) => i.path === pathname)
    return item ? item.name : 'Dashboard'
  }

  const isActive = (path: string) => pathname === path

  /**
   * Decides whether a nav item should be shown for the current user.
   */
  const isItemVisible = (item: NavItem): boolean =>
    checkPermission(permissions, user.role, item.permissionCode, item.permissionAction)

  /**
   * Decides whether a section should be shown:
   * - alwaysVisible sections → always shown
   * - Admin: all sections (since admins see everything)
   * - Staff: only if at least one item in the section is visible
   */
  const isSectionVisible = (section: NavSection): boolean => {
    if (section.alwaysVisible) return true
    if (isAdmin) return true
    // For staff: the section is visible if at least one item passes the permission check
    return section.items.some((item) => isItemVisible(item))
  }

  // Permissions are being fetched in the background after login.
  // Show a subtle loading indicator only for staff while permissions arrive.
  const isLoadingPermissions = !isAdmin && permissions === undefined

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderNavItems = (items: NavItem[], mobile = false) =>
    items
      .filter((item) => isItemVisible(item))
      .map((item) => {
        const active = isActive(item.path)
        const Icon = item.icon
        return (
          <Link
            key={item.path}
            href={item.path}
            onClick={mobile ? () => setMobileMenuOpen(false) : undefined}
            className={cn(
              'flex items-center px-4 py-2.5 mx-2 rounded-md transition-colors group',
              active
                ? 'bg-white/10 text-white border-l-4 border-primary'
                : 'text-ink-soft hover:bg-white/5 hover:text-white border-l-4 border-transparent'
            )}
            title={!isSidebarOpen && !mobile ? item.name : undefined}
          >
            <Icon
              size={mobile ? 18 : 20}
              className={cn(
                'shrink-0',
                active ? 'text-primary-light' : 'text-ink-soft group-hover:text-white'
              )}
            />
            {(isSidebarOpen || mobile) && (
              <span className="ml-3 text-sm font-medium">{item.name}</span>
            )}
          </Link>
        )
      })

  const renderSections = (mobile = false) =>
    navConfig
      .filter((section) => isSectionVisible(section))
      .map((section, idx) => {
        const visibleItems = section.items.filter((item) => isItemVisible(item))
        if (visibleItems.length === 0) return null
        return (
          <div key={idx} className="mb-6">
            {(isSidebarOpen || mobile) && (
              <div className="px-4 mb-2 text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                {section.label}
              </div>
            )}
            <div className="space-y-1">
              {renderNavItems(visibleItems, mobile)}
            </div>
          </div>
        )
      })

  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-sidebar text-white transition-all duration-300 z-20',
          isSidebarOpen ? 'w-[260px]' : 'w-[64px]'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Utensils size={18} className="text-white" />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col whitespace-nowrap">
                <span className="font-bold text-lg leading-tight">7Day Meals</span>
                <span className="text-[10px] text-white/60 uppercase tracking-wider">Staff Portal</span>
              </div>
            )}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {isLoadingPermissions ? (
            /* Permissions still loading — show a spinner */
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-ink-soft">
              <Loader2 size={20} className="animate-spin" />
              {isSidebarOpen && <span className="text-xs">Loading menu…</span>}
            </div>
          ) : (
            renderSections()
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-card border-b border-line flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="hidden md:block text-ink-soft hover:text-ink"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-semibold text-ink hidden sm:block">
              {getPageTitle()}
            </h1>
            <div className="sm:hidden font-bold text-lg text-primary">7Day Meals</div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" size={16} />
              <input
                type="text"
                placeholder="Search..."
                className="h-9 pl-9 pr-4 rounded-full bg-canvas border border-line text-sm focus:outline-none focus:ring-2 focus:ring-primary w-48 focus:w-64 transition-all"
              />
            </div>

            <button className="relative text-ink-soft hover:text-ink">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger-bg text-danger-fg text-[10px] font-bold flex items-center justify-center rounded-full">
                3
              </span>
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 hover:bg-canvas p-1 pr-2 rounded-full transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium leading-none">{user.name}</span>
                  <span className="text-xs text-ink-soft">{user.role}</span>
                </div>
                <ChevronDown size={16} className="text-ink-soft hidden sm:block" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-card shadow-card border border-line py-1 z-50">
                  <div className="px-4 py-2 border-b border-line sm:hidden">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-ink-soft">{user.role}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="block w-full text-left px-4 py-2 text-sm text-ink hover:bg-canvas flex items-center gap-2"
                  >
                    <UserIcon size={16} /> My Profile
                  </Link>
                  {(isAdmin || checkPermission(permissions, user.role, 'system_settings')) && (
                    <Link
                      href="/settings"
                      className="block w-full text-left px-4 py-2 text-sm text-ink hover:bg-canvas flex items-center gap-2"
                    >
                      <Settings size={16} /> Settings
                    </Link>
                  )}
                  <div className="h-px bg-line my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-danger-fg hover:bg-danger-bg flex items-center gap-2"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">{children}</main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-line flex justify-around items-center h-16 z-20 pb-safe">
        <Link
          href="/dashboard"
          className={cn(
            'flex flex-col items-center p-2',
            isActive('/dashboard') ? 'text-primary' : 'text-ink-soft'
          )}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] mt-1">Home</span>
        </Link>

        {checkPermission(permissions, user.role, 'meal_item') && (
          <Link
            href="/meals"
            className={cn(
              'flex flex-col items-center p-2',
              isActive('/meals') ? 'text-primary' : 'text-ink-soft'
            )}
          >
            <Utensils size={20} />
            <span className="text-[10px] mt-1">Meals</span>
          </Link>
        )}

        {checkPermission(permissions, user.role, 'inventory_item') && (
          <Link
            href="/inventory"
            className={cn(
              'flex flex-col items-center p-2',
              isActive('/inventory') ? 'text-primary' : 'text-ink-soft'
            )}
          >
            <Package size={20} />
            <span className="text-[10px] mt-1">Stock</span>
          </Link>
        )}

        {isAdmin && (
          <Link
            href="/users"
            className={cn(
              'flex flex-col items-center p-2',
              isActive('/users') ? 'text-primary' : 'text-ink-soft'
            )}
          >
            <Users size={20} />
            <span className="text-[10px] mt-1">Users</span>
          </Link>
        )}

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center p-2 text-ink-soft"
        >
          <Menu size={20} />
          <span className="text-[10px] mt-1">Menu</span>
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 bg-sidebar text-white h-full flex flex-col">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <span className="font-bold text-lg">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {isLoadingPermissions ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-ink-soft">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-xs">Loading menu…</span>
                </div>
              ) : (
                renderSections(true)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
