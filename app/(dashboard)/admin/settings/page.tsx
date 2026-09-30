"use client";

import { useState } from "react";
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
  Crown
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [monthlyPrice, setMonthlyPrice] = useState("4 900");
  const [quarterlyPrice, setQuarterlyPrice] = useState("12 900");
  const [yearlyPrice, setYearlyPrice] = useState("39 000");
  const [currency, setCurrency] = useState("FCFA");

  const [freeQuotas, setFreeQuotas] = useState(3);
  const [paidQuotas, setPaidQuotas] = useState(30);

  const handleSave = () => {
    toast.success("Paramètres enregistrés", {
      description: "La configuration des plans et quotas a été mise à jour avec succès."
    });
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
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold shadow-sm transition-all"
        >
          <Save className="size-4" />
          <span>Enregistrer les modifications</span>
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
