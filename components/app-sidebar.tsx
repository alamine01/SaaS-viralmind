"use client"

import * as React from "react"
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Bookmark,
  Zap,
  Settings,
  ChevronDown,
  BookOpen,
  Mic2,
  Plus,
  Target,
  LogOut,
  Video,
  UserRound,
  Eye,
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowLeft,
  Users
} from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import Logo from "@/components/ui/logo"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { CreateWorkspaceModal } from "@/components/create-workspace-modal"
import { useWorkspace } from "@/lib/workspace-context"

const menuItems = [
  { 
    title: "Tableau de bord", 
    url: "/dashboard", 
    icon: LayoutDashboard 
  },
  { 
    title: "Flux Viral", 
    url: "/feed", 
    icon: Zap 
  },
  {
    title: "Analyse Outlier",
    url: "/analyse",
    icon: Target,
  },
  {
    title: "Profil de Voix",
    url: "/voice",
    icon: UserRound,
  },
  {
    title: "Surveillance Radar",
    url: "/monitoring",
    icon: Eye,
  },
  { 
    title: "Générateur de Scripts", 
    url: "/scripts", 
    icon: FileText 
  },
  { 
    title: "Transcription", 
    url: "/transcription", 
    icon: Mic2 
  },
  { 
    title: "Bibliothèque de Hooks", 
    url: "/hooks", 
    icon: Sparkles 
  },
  {
    title: "Calendrier Éditorial",
    url: "/calendar",
    icon: Calendar
  },
  { 
    title: "Bibliothèque", 
    url: "/saved", 
    icon: Bookmark 
  },
  {
    title: "Administration",
    url: "/admin",
    icon: ShieldCheck
  }
]

function SidebarContent({ 
  onClose,
  isCollapsed = false,
  onToggleCollapse
}: { 
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [userName, setUserName] = useState<string>("User")
  const { activeCollection, workspaces, setCreateModalOpen, setActiveCollection } = useWorkspace()

  const isAdminPage = pathname.startsWith("/admin")
  const adminMenuItems = [
    { title: "Retour App", url: "/dashboard", icon: ArrowLeft },
    { title: "Tableau de Bord", url: "/admin", icon: BarChart3 },
    { title: "Gestion Utilisateurs", url: "/admin/users", icon: Users }
  ]

  const handleSelectWorkspace = (slug: string) => {
    setActiveCollection(slug)
    router.push(`${pathname}?collection=${slug}`)
    onClose?.()
  }
  const [quotas, setQuotas] = useState<any>(null)

  const fetchQuotas = async () => {
    try {
      const res = await fetch("/api/user/quotas")
      const data = await res.json()
      if (!data.error) {
        setQuotas(data)
      }
    } catch (e) {
      console.error("Error fetching quotas in sidebar:", e)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(user.email?.split('@')[0] || "User")
      }
    }
    getUser()
    fetchQuotas()

    // Listen for real-time quota changes (e.g. after upgrade on the settings page)
    window.addEventListener("quota-updated", fetchQuotas)
    return () => {
      window.removeEventListener("quota-updated", fetchQuotas)
    }
  }, [])

  // Re-fetch quotas when pathname changes to ensure sidebar matches operations
  useEffect(() => {
    fetchQuotas()
  }, [pathname])

  return (
    <div className="flex flex-col h-full w-full bg-white font-sans relative">
      {/* Collapse Toggle Button (Desktop only) */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute top-6 -right-3 z-[60] size-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title={isCollapsed ? "Agrandir le menu" : "Réduire le menu"}
        >
          <ChevronRight className={`size-3.5 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
        </button>
      )}

      {/* Logo Section */}
      <div className={`flex items-center h-20 transition-all duration-300 ease-in-out ${isCollapsed ? 'px-[26px]' : 'px-7'}`}>
        <Logo showText={!isCollapsed} />
        {!isCollapsed && isAdminPage && (
          <span className="bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ml-2.5 shadow-xs">
            Admin
          </span>
        )}
      </div>

      {/* Workspaces / Projects */}
      <div className={`flex-1 space-y-1 py-4 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {isAdminPage ? (
          <>
            {adminMenuItems.map((item) => {
               const isActive = pathname === item.url
               
               return (
                 <Link 
                   key={item.title}
                   href={item.url}
                   onClick={() => onClose?.()}
                   title={isCollapsed ? item.title : undefined}
                   className={`
                     flex items-center rounded-xl transition-all duration-300 ease-in-out group relative
                     ${isCollapsed ? 'justify-center px-0 w-10 h-10 mx-auto' : 'px-4 py-2.5 w-full h-10'}
                     ${isActive 
                       ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' 
                       : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
                   `}
                 >
                   <item.icon className={`
                     size-5 shrink-0 transition-transform duration-300
                     ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}
                   `} />
                   <span className={`
                     text-[14px] tracking-tight whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden
                     ${isCollapsed ? 'opacity-0 max-w-0 ml-0 pointer-events-none' : 'opacity-100 max-w-[150px] ml-3.5'}
                     ${isActive ? 'font-semibold' : 'font-medium'}
                   `}>
                     {item.title}
                   </span>
                 </Link>
               )
             })}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between px-3 mb-4 h-5 relative overflow-hidden">
               <div className="flex items-center w-full relative">
                 <span className={`absolute left-1/2 -translate-x-1/2 h-px bg-slate-100 transition-all duration-300 ease-in-out ${
                   isCollapsed ? 'w-8 opacity-100' : 'w-0 opacity-0'
                 }`} />
                 <p className={`text-[10px] font-semibold text-slate-400 uppercase tracking-widest opacity-60 transition-all duration-300 ease-in-out whitespace-nowrap ${
                   isCollapsed ? 'opacity-0 translate-x-4 pointer-events-none' : 'opacity-60 translate-x-0'
                 }`}>
                   Menu Principal
                 </p>
               </div>
               {onClose && (
                 <button 
                   onClick={onClose}
                   className={`lg:hidden text-slate-400 hover:text-slate-900 transition-colors p-1 ${isCollapsed ? 'hidden' : ''}`}
                   title="Fermer le menu"
                 >
                   <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               )}
            </div>
            
            {menuItems
              .filter((item) => {
                if (item.url === "/admin") {
                  return quotas?.role === "admin"
                }
                const plan = quotas?.plan?.toLowerCase() || "free"
                if (item.url === "/voice" || item.url === "/monitoring") {
                  return plan === "visionary" || plan === "titan"
                }
                return true
              })
              .map((item) => {
               const isActive = pathname === item.url
               
               return (
                 <Link 
                   key={item.title}
                   href={item.url}
                   onClick={() => onClose?.()}
                   title={isCollapsed ? item.title : undefined}
                   className={`
                     flex items-center rounded-xl transition-all duration-300 ease-in-out group relative
                     ${isCollapsed ? 'justify-center px-0 w-10 h-10 mx-auto' : 'px-4 py-2.5 w-full h-10'}
                     ${isActive 
                       ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                       : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
                   `}
                 >
                   <item.icon className={`
                     size-5 shrink-0 transition-transform duration-300
                     ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-600'}
                   `} />
                   <span className={`
                     text-[14px] tracking-tight whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden
                     ${isCollapsed ? 'opacity-0 max-w-0 ml-0 pointer-events-none' : 'opacity-100 max-w-[150px] ml-3.5'}
                     ${isActive ? 'font-semibold' : 'font-medium'}
                   `}>
                     {item.title}
                   </span>
                 </Link>
               )
             })}

            <div className="pt-8 pb-4">
                <div className="flex items-center justify-between px-3 mb-4 h-5 relative overflow-hidden">
                   <div className="flex items-center w-full relative">
                     <span className={`absolute left-1/2 -translate-x-1/2 h-px bg-slate-100 transition-all duration-300 ease-in-out ${
                       isCollapsed ? 'w-8 opacity-100' : 'w-0 opacity-0'
                     }`} />
                     <p className={`text-[10px] font-semibold text-slate-400 uppercase tracking-widest opacity-60 transition-all duration-300 ease-in-out whitespace-nowrap ${
                       isCollapsed ? 'opacity-0 translate-x-4 pointer-events-none' : 'opacity-60 translate-x-0'
                     }`}>
                       Workspaces
                     </p>
                   </div>
                   {!isCollapsed && (
                     <button 
                       onClick={() => setCreateModalOpen(true)}
                       className="text-slate-400 hover:text-slate-900 transition-colors absolute right-3"
                     >
                       <Plus className="size-3" />
                     </button>
                   )}
                </div>
                 <div className="space-y-1">
                    {workspaces.map((ws) => {
                      const isActive = activeCollection === ws.slug;
                      
                      return (
                        <button 
                          key={ws.slug}
                          onClick={() => handleSelectWorkspace(ws.slug)}
                          title={isCollapsed ? ws.name : undefined}
                          className={`
                            flex items-center rounded-xl text-[13px] transition-all duration-300 ease-in-out text-left relative
                            ${isCollapsed ? 'justify-center px-0 w-10 h-10 mx-auto' : 'w-full px-4 py-2 h-9'}
                            ${isActive ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}
                          `}
                        >
                           <div className={`size-2 rounded-full shrink-0 transition-all duration-300 ${ws.color} ${isCollapsed ? 'mr-0' : 'mr-3'}`} />
                           <span className={`
                             text-[13px] tracking-tight whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden
                             ${isCollapsed ? 'opacity-0 max-w-0 ml-0 pointer-events-none' : 'opacity-100 max-w-[150px] ml-0'}
                             ${isActive ? 'font-semibold' : 'font-medium'}
                           `}>
                             {ws.name}
                           </span>
                        </button>
                      )
                    })}
                 </div>
             </div>
          </>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className={`mt-auto border-t border-slate-50 transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <div className={`bg-slate-50/80 rounded-2xl border border-slate-100 transition-all duration-300 ease-in-out ${isCollapsed ? 'p-2 flex flex-col items-center gap-3' : 'p-4 space-y-4'}`}>
          <div className="flex items-center gap-3 w-full">
             <div className="size-10 rounded-xl bg-slate-900 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0" title={`${userName} (${quotas ? quotas.plan : "Gratuit"})`}>
                <img src={`https://ui-avatars.com/api/?name=${userName}&background=0f172a&color=818cf8&bold=true`} alt="" />
             </div>
             <div className={`flex-1 min-w-0 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[200px]'}`}>
                <p className="text-[13px] font-semibold text-slate-900 truncate uppercase">{userName}</p>
                <p className="text-[11px] text-indigo-500 font-extrabold uppercase tracking-tighter capitalize">
                  Plan {quotas ? quotas.plan : "Gratuit"}
                </p>
             </div>
          </div>

          {/* Real-time Quota Bars */}
          {quotas && !isAdminPage && (
            <div className={`space-y-2.5 transition-all duration-300 ease-in-out overflow-hidden ${
              isCollapsed ? 'max-h-0 opacity-0 border-t-0 pt-0' : 'max-h-[100px] opacity-100 pt-2.5 border-t border-slate-200/50'
            }`}>
              {/* Scripts IA Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 whitespace-nowrap">
                  <span>Scripts IA (jour)</span>
                  <span>{quotas.daily_script_count} / {quotas.limits.dailyScripts === 9999 ? "∞" : quotas.limits.dailyScripts}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 rounded-full"
                    style={{ width: `${quotas.limits.dailyScripts === 9999 ? 5 : Math.min(100, (quotas.daily_script_count / (quotas.limits.dailyScripts || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Analyses Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 whitespace-nowrap">
                  <span>Analyses (mois)</span>
                  <span>{quotas.monthly_analysis_count} / {quotas.limits.monthlyAnalysis}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, (quotas.monthly_analysis_count / (quotas.limits.monthlyAnalysis || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className={`w-full flex transition-all duration-300 ${isCollapsed ? 'flex-col gap-2.5 items-center' : 'flex-row gap-2 pt-1'}`}>
            <Link 
              href="/settings"
              onClick={() => onClose?.()}
              className={`
                flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:border-slate-350 transition-all shadow-xs shrink-0
                ${isCollapsed ? 'size-10' : 'flex-1 py-2 gap-2 text-[12px] font-semibold'}
              `}
              title="Paramètres"
            >
              <Settings className="size-4" />
              <span className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[100px]'}`}>
                Paramètres
              </span>
            </Link>
            <button 
              onClick={async () => {
                onClose?.()
                await supabase.auth.signOut()
                toast.success("Déconnexion réussie")
                window.location.href = "/signin"
              }}
              className={`
                flex items-center justify-center bg-rose-50 border border-rose-100 rounded-xl text-rose-600 hover:bg-rose-100 transition-all shrink-0
                ${isCollapsed ? 'size-10' : 'flex-1 py-2 gap-2 text-[12px] font-semibold'}
              `}
              title="Quitter"
            >
              <LogOut className="size-4" />
              <span className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${isCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[100px]'}`}>
                Quitter
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppSidebar({ 
  onClose,
  isCollapsed = false,
  onToggleCollapse
}: { 
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <Suspense fallback={<div className={`h-full bg-white border-r border-slate-100 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`} />}>
      <SidebarContent onClose={onClose} isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />
    </Suspense>
  )
}
