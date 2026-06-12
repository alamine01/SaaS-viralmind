"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Menu, ChevronDown, ArrowLeft, ShieldCheck } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { WorkspaceProvider, useWorkspace } from "@/lib/workspace-context"
import { Suspense } from "react"
import Link from "next/link"

import { CreateWorkspaceModal } from "@/components/create-workspace-modal"

function DashboardContainer({ children }: { children: React.ReactNode }) {
  const { activeCollection, isCreateModalOpen, setCreateModalOpen } = useWorkspace()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userName, setUserName] = useState<string>("User")
  const [authLoading, setAuthLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [quotas, setQuotas] = useState<any>(null)

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
    const saved = localStorage.getItem("sidebar_collapsed")
    if (saved === "true") {
      setIsSidebarCollapsed(true)
    }
  }, [])

  const toggleSidebarCollapse = () => {
    const newVal = !isSidebarCollapsed
    setIsSidebarCollapsed(newVal)
    localStorage.setItem("sidebar_collapsed", String(newVal))
  }

  useEffect(() => {
    const checkUser = async () => {
      setAuthLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/signin")
        return
      }
      setUserName(user.email?.split('@')[0] || "User")
      setAuthLoading(false)
    }
    checkUser()
    fetchQuotas()

    // Listen for real-time quota changes
    window.addEventListener("quota-updated", fetchQuotas)
    return () => {
      window.removeEventListener("quota-updated", fetchQuotas)
    }
  }, [router])

  // Re-fetch quotas when pathname changes to ensure role check is fresh
  useEffect(() => {
    fetchQuotas()
  }, [pathname])

  if (authLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white gap-4">
        <div className="relative">
           <div className="size-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        </div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Vérification de l'accès...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white font-sans antialiased text-slate-900">
      
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/10 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-100 transform transition-[width,transform] duration-300 ease-in-out lg:static lg:translate-x-0 lg:relative shrink-0
        ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
        w-64
        ${sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        <AppSidebar 
          onClose={() => setSidebarOpen(false)} 
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />
      </div>

      {/* Content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-slate-50/30">
        
        {/* Header - Strictly Minimal */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center px-4 sm:px-8">
          <div className="flex items-center justify-between w-full">
            
            <div className="flex items-center gap-4">
              <button
                className="text-slate-400 hover:text-slate-600 lg:hidden transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="size-5" />
              </button>
              
              <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
                 <span className="hover:text-blue-600 cursor-pointer">ViralMind</span>
                 <span className="text-slate-200">/</span>
                 <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">
                    {activeCollection}
                 </span>
                 <span className="text-slate-200">/</span>
                 <span className="text-slate-600 font-semibold">{pathname.split('/').pop()?.replace(/-/g, ' ')}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Admin Access Button */}
              {quotas?.role === "admin" && (
                pathname.startsWith("/admin") ? (
                  <Link 
                    href="/dashboard"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-xs"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span className="hidden sm:inline">Retour App</span>
                  </Link>
                ) : (
                  <Link 
                    href="/admin"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100"
                  >
                    <ShieldCheck className="size-3.5 animate-pulse" />
                    <span>Espace Admin</span>
                  </Link>
                )
              )}

              <button className="flex items-center gap-2.5 pl-2 py-1 group">
                 <div className="size-7 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                    <img src={`https://ui-avatars.com/api/?name=${userName}&background=f1f5f9&color=64748b&bold=true`} alt="User" className="size-full object-cover" />
                 </div>
                 <ChevronDown className="size-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </button>
            </div>

          </div>
        </header>

        {/* Main View */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 sm:p-10">
           <div className="max-w-6xl mx-auto">
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
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-white">Chargement...</div>}>
      <WorkspaceProvider>
        <DashboardContainer>
          {children}
        </DashboardContainer>
      </WorkspaceProvider>
    </Suspense>
  )
}
