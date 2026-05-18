"use client"

import React, { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Mail, Lock, Globe, Loader2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

interface AuthFormProps {
  mode?: "signin" | "signup"
}

export function AuthForm({ mode = "signin" }: AuthFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ 
          email: email.trim(), 
          password 
        })
        if (error) throw error
        toast.success("Compte créé ! Redirection...")
        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 1000)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ 
          email: email.trim(), 
          password 
        })
        if (error) throw error
        toast.success("Connexion réussie ! Cockpit en vue...")
        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 1000)
      }
    } catch (err: any) {
      const msg = err.message === "Invalid login credentials" 
        ? "Email ou mot de passe incorrect." 
        : err.message
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    })
    if (error) setError(error.message)
  }

  return (
    <div className="space-y-6 w-full max-w-sm">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
          {mode === "signin" ? "Bienvenue" : "Créer un compte"}
        </h1>
        <p className="text-gray-500 text-sm">
          {mode === "signin" 
            ? "Rejoignez l'élite des créateurs de contenu viral."
            : "Rejoignez l'élite et commencez à créer du contenu viral."}
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <button 
          type="button"
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all shadow-sm group"
        >
          <Globe className="size-4 text-gray-600 group-hover:text-blue-600" />
          <span className="text-xs font-bold text-gray-700">Continuer avec Google</span>
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
          <span className="bg-white px-4 text-gray-300">Ou via email</span>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-300" />
            <input 
              type="email" 
              placeholder="votre@email.com" 
              required
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 outline-hidden transition-all text-sm font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mot de passe</label>
            {mode === "signin" && (
              <Link href="/reset-password" className="text-[10px] font-bold text-blue-600 hover:underline">Oublié ?</Link>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-300" />
            <input 
              type="password" 
              placeholder="••••••••"
              required
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 outline-hidden transition-all text-sm font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : (mode === "signin" ? "Se connecter" : "Créer mon compte")}
          </button>
        </div>
        
        <div className="text-center mt-6">
          {mode === "signin" ? (
            <p className="text-xs text-gray-500">
              Pas encore de compte ?{" "}
              <Link href="/signup" className="font-bold text-blue-600 hover:underline">
                S'inscrire
              </Link>
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Déjà un compte ?{" "}
              <Link href="/signin" className="font-bold text-blue-600 hover:underline">
                Se connecter
              </Link>
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
