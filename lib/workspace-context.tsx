"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Workspace = {
  id?: string
  name: string
  slug: string
  color: string
  voice_profile_id?: string
}

type WorkspaceContextType = {
  activeCollection: string
  setActiveCollection: (name: string) => void
  workspaces: Workspace[]
  activeWorkspace?: Workspace
  refreshWorkspaces: () => Promise<void>
  isCreateModalOpen: boolean
  setCreateModalOpen: (open: boolean) => void
  loading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

const DEFAULT_WORKSPACES: Workspace[] = [
  { name: "Général", slug: "General", color: "bg-emerald-400" }
]

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [activeCollection, setActiveCollectionState] = useState<string>("General")
  const [workspaces, setWorkspaces] = useState<Workspace[]>(DEFAULT_WORKSPACES)
  const [isCreateModalOpen, setCreateModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  const activeWorkspace = workspaces.find(w => w.slug === activeCollection || w.name === activeCollection)

  const loadWorkspaces = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setWorkspaces(DEFAULT_WORKSPACES)
        return
      }

      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .order("created_at", { ascending: true })

      if (error) {
        console.warn("Table workspaces non trouvée ou erreur, repli sur local:", error.message)
        // Fallback sur le comportement précédent si la table n'est pas encore créée
        const custom = JSON.parse(localStorage.getItem("custom_workspaces") || "[]")
        const customWorkspaces = custom.map((name: string) => ({
          name,
          slug: name,
          color: `bg-slate-400`
        }))
        setWorkspaces([...DEFAULT_WORKSPACES, ...customWorkspaces])
      } else {
        setWorkspaces([...DEFAULT_WORKSPACES, ...(data || [])])
      }
    } catch (err) {
      console.error("Erreur chargement workspaces:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkspaces()
    
    // Sync with URL if present
    const collection = searchParams.get("collection")
    if (collection) {
      setActiveCollectionState(collection)
      localStorage.setItem("active_collection", collection)
    } else {
      // Sync with localStorage
      const saved = localStorage.getItem("active_collection")
      if (saved) setActiveCollectionState(saved)
    }
  }, [searchParams])

  const setActiveCollection = (name: string) => {
    setActiveCollectionState(name)
    localStorage.setItem("active_collection", name)
  }

  return (
    <WorkspaceContext.Provider value={{ 
      activeCollection, 
      setActiveCollection, 
      workspaces, 
      activeWorkspace,
      refreshWorkspaces: loadWorkspaces,
      isCreateModalOpen,
      setCreateModalOpen,
      loading
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return context
}
