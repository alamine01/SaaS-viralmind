"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/dashboard/Sidebar"
import Header from "@/components/dashboard/Header"
import { ThemeProvider } from "@/components/dashboard/ThemeProvider"
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
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-gray-900 gap-4">
        <div className="relative">
           <div className="size-12 border-4 border-violet-100 dark:border-violet-950 border-t-violet-600 dark:border-t-violet-500 rounded-full animate-spin" />
        </div>
        <p className="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase tracking-widest animate-pulse">Vérification de l'accès...</p>
      </div>
    )
  }

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
      <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-white dark:bg-gray-900">Chargement...</div>}>
        <WorkspaceProvider>
          <DashboardContainer>
            {children}
          </DashboardContainer>
        </WorkspaceProvider>
      </Suspense>
    </ThemeProvider>
  )
}
