"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/dashboard/Sidebar"
import Header from "@/components/dashboard/Header"
import { ThemeProvider } from "@/components/dashboard/ThemeProvider"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { WorkspaceProvider, useWorkspace } from "@/lib/workspace-context"
import { Suspense } from "react"
import Link from "next/link"
import {
  BarChart3,
  Users,
  Brain,
  Zap,
  Menu,
  Search,
  Bell,
  Settings,
  ChevronRight,
  ChevronLeft,
  Shield,
  LayoutDashboard,
  LogOut,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
} from "lucide-react"

import { CreateWorkspaceModal } from "@/components/create-workspace-modal"

/* ─── ADMIN SIDEBAR (OptiGest Pro Style — Collapsible Dark Navy) ─── */
function AdminSidebar({ 
  mobileOpen, 
  setMobileOpen,
  collapsed,
  setCollapsed,
}: { 
  mobileOpen: boolean; 
  setMobileOpen: (v: boolean) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const pathname = usePathname()

  const adminLinks = [
    { label: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
    { label: "Gestion Créateurs", href: "/admin/users", icon: Users },
    { label: "Paramètres", href: "/admin/settings", icon: Settings },
  ]

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-200 ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen shrink-0 bg-[#152259] flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 lg:static ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-[76px]" : "w-[260px]"}`}
      >
        {/* Brand Logo & Collapse Toggle */}
        <div className={`pt-6 pb-5 border-b border-white/5 transition-all ${collapsed ? "px-3" : "px-5"}`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
            <Link href="/admin" className="flex items-center gap-3 overflow-hidden group">
              <div className="size-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 28 28" className="shrink-0">
                  <path
                    className="fill-white"
                    fillRule="evenodd"
                    d="M15.052 0c6.914.513 12.434 6.033 12.947 12.947h-5.015a7.932 7.932 0 0 1-7.932-7.932V0Zm-2.105 22.985V28C6.033 27.487.513 21.967 0 15.053h5.015a7.932 7.932 0 0 1 7.932 7.932Z"
                    clipRule="evenodd"
                  />
                  <path
                    className="fill-white/80"
                    fillRule="evenodd"
                    d="M0 12.947C.513 6.033 6.033.513 12.947 0v5.015a7.932 7.932 0 0 1-7.932 7.932H0Zm22.984 2.106h5.015C27.486 21.967 21.966 27.487 15.052 28v-5.015a7.932 7.932 0 0 1 7.932-7.932Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              {!collapsed && (
                <div className="animate-in fade-in duration-200">
                  <div className="text-[15px] font-bold text-white tracking-tight leading-tight">ViralMind</div>
                  <div className="text-[10px] text-blue-300/70 font-medium whitespace-nowrap">Panneau Admin</div>
                </div>
              )}
            </Link>

            {/* Desktop Collapse Toggle Button */}
            {!collapsed && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex p-1.5 rounded-lg text-blue-300/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Replier la barre latérale"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 mt-4 space-y-1.5 transition-all ${collapsed ? "px-2" : "px-3"}`}>
          {adminLinks.map((link) => {
            const isActive = pathname === link.href
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? link.label : undefined}
                className={`group flex items-center rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  collapsed 
                    ? "justify-center size-11 mx-auto" 
                    : "gap-3 px-3.5 py-3"
                } ${
                  isActive
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "text-blue-200/70 hover:text-white hover:bg-white/8"
                }`}
              >
                <Icon className={`size-[18px] shrink-0 ${isActive ? "text-white" : "text-blue-300/60 group-hover:text-blue-200"}`} />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{link.label}</span>
                    <ChevronRight className={`size-4 ${isActive ? "text-white/70" : "text-blue-300/30 group-hover:text-blue-200/50"}`} />
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Collapsed quick expand button */}
        {collapsed && (
          <div className="p-3 flex justify-center hidden lg:flex">
            <button
              onClick={() => setCollapsed(false)}
              className="p-2 rounded-xl text-blue-300/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Déplier la barre latérale"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}

        {/* Bottom footer / Version & Sync */}
        <div className={`pb-6 transition-all ${collapsed ? "px-2" : "px-5"}`}>
          {!collapsed ? (
            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-blue-300/40">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Firebase Sync
              </span>
              <span>v 1.2.0</span>
            </div>
          ) : (
            <div className="flex justify-center pt-2">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" title="Firebase En direct" />
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

/* ─── ADMIN TOP BAR (White, OptiGest Style with quick toggle & status) ─── */
function AdminTopBar({ 
  onToggleMobile, 
  collapsed, 
  onToggleCollapse 
}: { 
  onToggleMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false)
  const router = useRouter()

  return (
    <header className="bg-white border-b border-gray-200/80 px-4 lg:px-8 py-3 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Left: Desktop Toggle / Mobile hamburger */}
      <div className="flex items-center gap-3">
        {/* Mobile Toggle */}
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Menu className="size-5" />
        </button>

        {/* Desktop Collapse / Expand Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors cursor-pointer"
          title={collapsed ? "Déplier le menu" : "Replier le menu"}
        >
          {collapsed ? <PanelLeftOpen className="size-5 text-blue-600" /> : <PanelLeftClose className="size-5" />}
        </button>
      </div>

      {/* Right: Realtime status + Profile */}
      <div className="flex items-center gap-3">
        {/* Live sync badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-medium">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>En direct</span>
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 pl-2.5 border-l border-gray-200 cursor-pointer group"
          >
            <div className="size-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:ring-2 group-hover:ring-blue-400/30 transition-all">
              A
            </div>
            <div className="hidden md:block text-left">
              <div className="text-[13px] font-semibold text-gray-800 leading-tight">Amine</div>
              <div className="text-[11px] text-gray-400 font-medium">Administrateur</div>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-800">Amine Admin</p>
                <p className="text-[11px] text-gray-400">admin@viralmind.app</p>
              </div>
              <Link
                href="/admin/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="size-3.5 text-gray-400" />
                Paramètres Système
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="size-3.5 text-gray-400" />
                Espace Créateur
              </Link>
              <div className="pt-1 border-t border-gray-100">
                <button
                  onClick={() => {
                    setProfileOpen(false)
                    router.push("/signin")
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="size-3.5 text-red-500" />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

/* ─── MAIN CONTAINER ─── */
function DashboardContainer({ children }: { children: React.ReactNode }) {
  const { activeCollection, isCreateModalOpen, setCreateModalOpen } = useWorkspace()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminCollapsed, setAdminCollapsed] = useState(false)
  const [userName, setUserName] = useState<string>("User")
  const [authLoading, setAuthLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  const [quotas, setQuotas] = useState<any>(null)
  const isAdminRoute = pathname.startsWith("/admin")

  // Load collapsed preference from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin_sidebar_collapsed")
      if (saved !== null) {
        setAdminCollapsed(saved === "true")
      }
    }
  }, [])

  const handleToggleAdminCollapsed = (val: boolean) => {
    setAdminCollapsed(val)
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_sidebar_collapsed", String(val))
    }
  }

  const fetchQuotas = async () => {
    try {
      const res = await fetch("/api/user/quotas")
      const data = await res.json()
      if (!data.error) {
        setQuotas(data)
      }
    } catch (e) {
      console.error("Error fetching quotas in layout:", e)
    }
  }

  useEffect(() => {
    const checkUser = async () => {
      setAuthLoading(true)

      // Sur les pages /admin, pas de blocage Supabase
      if (pathname.startsWith("/admin")) {
        setUserName("Administrateur")
        setAuthLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/signin")
        return
      }
      setUserName(user.email?.split('@')[0] || "User")
      setAuthLoading(false)
    }
    checkUser()
    if (!isAdminRoute) fetchQuotas()

    window.addEventListener("quota-updated", fetchQuotas)
    return () => {
      window.removeEventListener("quota-updated", fetchQuotas)
    }
  }, [router, pathname])

  if (authLoading) {
    return (
      <div className={`h-screen w-full flex flex-col items-center justify-center gap-4 ${
        isAdminRoute ? "bg-[#F0F4F8]" : "bg-white dark:bg-gray-900"
      }`}>
        <div className="relative">
          <div className={`size-12 border-4 rounded-full animate-spin ${
            isAdminRoute
              ? "border-blue-100 border-t-blue-500"
              : "border-violet-100 dark:border-violet-950 border-t-violet-600 dark:border-t-violet-500"
          }`} />
        </div>
        <p className={`font-bold text-xs uppercase tracking-widest animate-pulse ${
          isAdminRoute ? "text-gray-400" : "text-gray-400 dark:text-gray-500"
        }`}>
          {isAdminRoute ? "Chargement du cockpit..." : "Vérification de l'accès..."}
        </p>
      </div>
    )
  }

  /* ── ADMIN LAYOUT (Light content, dark sidebar with collapse support) ── */
  if (isAdminRoute) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#F0F4F8] text-gray-800 font-sans antialiased">
        <AdminSidebar 
          mobileOpen={sidebarOpen} 
          setMobileOpen={setSidebarOpen} 
          collapsed={adminCollapsed}
          setCollapsed={handleToggleAdminCollapsed}
        />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <AdminTopBar 
            onToggleMobile={() => setSidebarOpen(!sidebarOpen)}
            collapsed={adminCollapsed}
            onToggleCollapse={() => handleToggleAdminCollapsed(!adminCollapsed)}
          />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-[1400px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  }

  /* ── STANDARD DASHBOARD LAYOUT ── */
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-gray-100 font-sans antialiased">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <CreateWorkspaceModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
      />
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#F0F4F8] text-gray-400 text-sm">Chargement...</div>}>
        <WorkspaceProvider>
          <DashboardContainer>
            {children}
          </DashboardContainer>
        </WorkspaceProvider>
      </Suspense>
    </ThemeProvider>
  )
}

