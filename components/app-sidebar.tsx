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
  Sparkles
} from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
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
    title: "Mes Vidéos",
    url: "/videos",
    icon: Video,
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
    title: "Bibliothèque", 
    url: "/saved", 
    icon: Bookmark 
  },
]

function SidebarContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [userName, setUserName] = useState<string>("User")
  const { activeCollection, workspaces, setCreateModalOpen } = useWorkspace()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(user.email?.split('@')[0] || "User")
      }
    }
    getUser()
  }, [])

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-100 font-sans">
      {/* Logo Section */}
      <div className="flex items-center h-20 px-7">
        <Logo />
      </div>

      {/* Workspaces / Projects */}
      <div className="flex-1 px-4 space-y-1 py-4 overflow-y-auto">
        <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4 opacity-60">Menu Principal</p>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.url
          
          return (
            <Link 
              key={item.title}
              href={item.url}
              className={`
                flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
              `}
            >
              <item.icon className={`
                size-5 shrink-0
                ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-600'}
              `} />
              <span className={`text-[14px] ml-3.5 tracking-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.title}
              </span>
            </Link>
          )
        })}

        <div className="pt-8 pb-4">
           <div className="flex items-center justify-between px-3 mb-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest opacity-60">Workspaces</p>
              <button 
                onClick={() => setCreateModalOpen(true)}
                className="text-slate-400 hover:text-slate-900 transition-colors"
              >
                <Plus className="size-3" />
              </button>
           </div>
           <div className="space-y-1">
              {workspaces.map((ws) => {
                const isActive = activeCollection === ws.slug && pathname === "/saved";
                
                return (
                  <Link 
                    key={ws.slug}
                    href={`/saved?collection=${ws.slug}`} 
                    className={`
                      flex items-center px-4 py-2 rounded-xl text-[13px] font-medium transition-all
                      ${isActive ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}
                    `}
                  >
                     <div className={`size-2 rounded-full ${ws.color} mr-3`} />
                     {ws.name}
                  </Link>
                )
              })}
           </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 mt-auto border-t border-slate-50">
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
             <div className="size-10 rounded-xl bg-slate-900 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                <img src={`https://ui-avatars.com/api/?name=${userName}&background=0f172a&color=818cf8&bold=true`} alt="" />
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-900 truncate uppercase">{userName}</p>
                <p className="text-[11px] text-indigo-500 font-semibold uppercase tracking-tighter">Plan Agency</p>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Link 
              href="/settings"
              className="flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all shadow-xs"
            >
              <Settings className="size-3.5" />
              <span>Paramètres</span>
            </Link>
            <button 
              onClick={async () => {
                await supabase.auth.signOut()
                toast.success("Déconnexion réussie")
                window.location.href = "/signin"
              }}
              className="flex items-center justify-center gap-2 py-2 bg-rose-50 border border-rose-100 rounded-lg text-[12px] font-semibold text-rose-600 hover:bg-rose-100 transition-all"
            >
              <LogOut className="size-3.5" />
              <span>Quitter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppSidebar() {
  return (
    <Suspense fallback={<div className="h-full bg-white border-r border-slate-100 w-64" />}>
      <SidebarContent />
    </Suspense>
  )
}
