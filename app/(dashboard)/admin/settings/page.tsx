"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  CreditCard, 
  ShieldCheck, 
  Bell, 
  Database, 
  Check, 
  Save, 
  ArrowLeft,
  Calendar,
  Sparkles,
  Crown,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [monthlyPrice, setMonthlyPrice] = useState("4 900");
  const [quarterlyPrice, setQuarterlyPrice] = useState("12 900");
  const [yearlyPrice, setYearlyPrice] = useState("39 900");
  const [currency, setCurrency] = useState("FCFA");

  const [freeQuotas, setFreeQuotas] = useState(3);
  const [paidQuotas, setPaidQuotas] = useState(30);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pricing");
      const data = await res.json();
      if (data.pricing) {
        setMonthlyPrice(Number(data.pricing.monthlyPrice).toLocaleString("fr-FR"));
        setQuarterlyPrice(Number(data.pricing.quarterlyPrice).toLocaleString("fr-FR"));
        setYearlyPrice(Number(data.pricing.yearlyPrice).toLocaleString("fr-FR"));
        setCurrency(data.pricing.currency || "FCFA");
        setFreeQuotas(data.pricing.freeQuotas ?? 3);
        setPaidQuotas(data.pricing.paidQuotas ?? 30);
      }
    } catch (e: any) {
      console.error("Error loading pricing:", e);
      toast.error("Impossible de charger les tarifs depuis Firestore.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyPrice,
          quarterlyPrice,
          yearlyPrice,
          currency,
          freeQuotas,
          paidQuotas,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success("Tarifs et quotas enregistrés !", {
        description: "Synchronisation immédiate sur l'application mobile et le site web.",
      });
    } catch (e: any) {
      toast.error("Erreur d'enregistrement : " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all shadow-sm"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              Paramètres de la Plateforme
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gestion des tarifications, des quotas et de la synchronisation Firebase
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          <span>{saving ? "Synchronisation..." : "Enregistrer les modifications"}</span>
        </button>
      </div>

      {/* PRICING PLANS */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="size-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
            <CreditCard className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">Tarification des Abonnements</h2>
            <p className="text-xs text-gray-400">Montants appliqués pour les 3 types de plans</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Plan Mensuel */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-blue-500" />
              <span className="text-sm font-bold text-gray-800">Plan Mensuel</span>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Tarif (FCFA)</label>
              <input
                type="text"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                className="w-full bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <p className="text-[11px] text-gray-400">Facturation mensuelle récurrente</p>
          </div>

          {/* Plan Trimestriel */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-purple-500" />
              <span className="text-sm font-bold text-gray-800">Plan Trimestriel</span>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Tarif (FCFA)</label>
              <input
                type="text"
                value={quarterlyPrice}
                onChange={(e) => setQuarterlyPrice(e.target.value)}
                className="w-full bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
              />
            </div>
            <p className="text-[11px] text-gray-400">Facturation tous les 3 mois</p>
          </div>

          {/* Plan Annuel */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
            <div className="flex items-center gap-2">
              <Crown className="size-4 text-amber-500" />
              <span className="text-sm font-bold text-gray-800">Plan Annuel</span>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Tarif (FCFA)</label>
              <input
                type="text"
                value={yearlyPrice}
                onChange={(e) => setYearlyPrice(e.target.value)}
                className="w-full bg-white border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
              />
            </div>
            <p className="text-[11px] text-gray-400">Facturation annuelle avantageuse</p>
          </div>
        </div>
      </div>

      {/* QUOTAS */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="size-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">Quotas Quotidiens d'Analyses IA</h2>
            <p className="text-xs text-gray-400">Limites d'utilisation par profil</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1 font-medium">Comptes Gratuits (analyses / jour)</label>
            <input
              type="number"
              value={freeQuotas}
              onChange={(e) => setFreeQuotas(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl text-sm text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1 font-medium">Comptes Abonnés (analyses / jour)</label>
            <input
              type="number"
              value={paidQuotas}
              onChange={(e) => setPaidQuotas(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl text-sm text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
        </div>
      </div>

      {/* DATABASE INFO */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="size-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <Database className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800">Base de Données</h2>
            <p className="text-xs text-gray-400">Statut de la connexion cloud</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200/60">
          <div>
            <div className="text-sm font-semibold text-gray-800">Firebase Firestore</div>
            <div className="text-xs text-gray-400">Projet: viralmind-8a284 (Collection: users)</div>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
            <Check className="size-3" /> Connecté
          </span>
        </div>
      </div>
    </div>
  );
}
