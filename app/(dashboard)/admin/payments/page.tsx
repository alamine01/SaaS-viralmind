"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Search,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Crown,
  DollarSign,
  TrendingUp,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Smartphone,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Eye,
  Filter,
  Receipt,
  X,
  Zap,
  User,
  Phone,
  Mail,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  plan: "monthly" | "quarterly" | "yearly" | "other";
  planLabel: string;
  amount: number;
  currency: string;
  refCommand: string;
  itemName: string;
  gateway: string;
  paymentMethod: string;
  status: "completed" | "pending" | "failed" | "refunded";
  createdAt: string;
  rawDate: string;
}

interface PaymentStats {
  totalRevenue: number;
  todayRevenue: number;
  thisMonthRevenue: number;
  totalTransactions: number;
  completedTransactions: number;
  planDistribution: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };
}

export default function AdminPaymentsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlanFilter, setSelectedPlanFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Modal Détails Transaction
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTransactions(data.transactions || []);
      setStats(data.stats || null);
    } catch (error: any) {
      toast.error("Erreur de chargement", {
        description: error.message || "Impossible de charger les paiements.",
      });
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(text);
    toast.success("Copié !", { description: `Référence ${text} copiée.` });
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const exportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error("Aucune transaction à exporter");
      return;
    }

    const headers = [
      "Date",
      "Nom Client",
      "Email",
      "Numéro Paiement",
      "Plan",
      "Montant (FCFA)",
      "Moyen de Paiement",
      "Référence PayTech",
      "Statut",
    ];

    const rows = filteredTransactions.map((tx) => [
      `"${tx.createdAt}"`,
      `"${tx.userName.replace(/"/g, '""')}"`,
      `"${tx.userEmail}"`,
      `"${tx.userPhone || "N/A"}"`,
      `"${tx.planLabel}"`,
      tx.amount,
      `"${tx.paymentMethod}"`,
      `"${tx.refCommand}"`,
      `"${tx.status}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `viralmind_paiements_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Export terminé", {
      description: `${filteredTransactions.length} transactions exportées en CSV.`,
    });
  };

  // Filtrage
  const filteredTransactions = transactions.filter((tx) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === "" ||
      tx.userName.toLowerCase().includes(query) ||
      tx.userEmail.toLowerCase().includes(query) ||
      (tx.userPhone && tx.userPhone.includes(query)) ||
      tx.refCommand.toLowerCase().includes(query) ||
      tx.paymentMethod.toLowerCase().includes(query) ||
      tx.itemName.toLowerCase().includes(query);

    const matchesPlan =
      selectedPlanFilter === "all" || tx.plan === selectedPlanFilter;

    const matchesStatus =
      selectedStatusFilter === "all" || tx.status === selectedStatusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  };

  // Helper pour styliser le moyen de paiement (Wave, Orange, etc.)
  const renderPaymentMethodBadge = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes("wave")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
          🌊 Wave
        </span>
      );
    }
    if (m.includes("orange")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
          🍊 Orange Money
        </span>
      );
    }
    if (m.includes("mtn")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
          🟡 MTN Mobile Money
        </span>
      );
    }
    if (m.includes("moov")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          🔵 Moov Money
        </span>
      );
    }
    if (m.includes("free")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800">
          🔴 Free Money
        </span>
      );
    }
    if (m.includes("card") || m.includes("carte") || m.includes("visa") || m.includes("mastercard")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          💳 Carte Bancaire
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        📱 Mobile Money (PayTech)
      </span>
    );
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour au Dashboard Admin
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-emerald-500" />
            Suivi des Paiements & Abonnements
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Historique complet des transactions Mobile Money (PayTech, Wave, Orange Money, MTN, Moov) et abonnements actifs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPayments}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-violet-500" : ""}`} />
            Actualiser
          </button>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenu Total */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Revenu Total
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {stats ? formatFCFA(stats.totalRevenue) : "—"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Mobile Money & Cartes</span>
            </div>
          </div>
        </div>

        {/* Revenu du Mois */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Ce Mois-ci
            </span>
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {stats ? formatFCFA(stats.thisMonthRevenue) : "—"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Aujourd'hui :{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-200">
                {stats ? formatFCFA(stats.todayRevenue) : "0 FCFA"}
              </span>
            </div>
          </div>
        </div>

        {/* Transactions Validées */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Transactions Payées
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {stats ? stats.completedTransactions : "—"}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Sur {stats ? stats.totalTransactions : 0} tentatives enregistrées
            </div>
          </div>
        </div>

        {/* Répartition des Formules */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Formules Actives
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Crown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
              {stats?.planDistribution.monthly || 0} Mensuel
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
              {stats?.planDistribution.quarterly || 0} Trim.
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {stats?.planDistribution.yearly || 0} Annuel
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher créateur, email, téléphone, opérateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-violet-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtres :</span>
          </div>

          <select
            value={selectedPlanFilter}
            onChange={(e) => setSelectedPlanFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-violet-500"
          >
            <option value="all">Tous les plans</option>
            <option value="monthly">Mensuel (4 900 FCFA)</option>
            <option value="quarterly">Trimestriel (12 900 FCFA)</option>
            <option value="yearly">Annuel (39 900 FCFA)</option>
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-violet-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="completed">Validé / Complété</option>
            <option value="pending">En attente</option>
            <option value="failed">Échoué</option>
          </select>

          {(searchQuery || selectedPlanFilter !== "all" || selectedStatusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedPlanFilter("all");
                setSelectedStatusFilter("all");
              }}
              className="text-xs text-violet-600 dark:text-violet-400 hover:underline px-2 shrink-0"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table - Épuré et Aéré (Colonnes réduites) */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Journal des Transactions
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              {filteredTransactions.length} {filteredTransactions.length > 1 ? "transactions" : "transaction"}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chargement des transactions PayTech & Mobile Money...
            </p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Aucune transaction trouvée
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
              Aucun paiement ne correspond à vos critères de recherche.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Date & Heure</th>
                  <th className="py-3.5 px-6">Client / Créateur</th>
                  <th className="py-3.5 px-6">Montant</th>
                  <th className="py-3.5 px-6">Statut</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-sm">
                {filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    {/* Date */}
                    <td className="py-4 px-6 whitespace-nowrap text-xs text-gray-600 dark:text-gray-300 font-medium">
                      {tx.createdAt}
                    </td>

                    {/* Créateur */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-bold flex items-center justify-center text-xs shrink-0">
                          {tx.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                            {tx.userName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {tx.userEmail}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Montant */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="text-base font-black text-gray-900 dark:text-white">
                        {formatFCFA(tx.amount)}
                      </span>
                    </td>

                    {/* Statut */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {tx.status === "completed" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Validé
                        </span>
                      ) : tx.status === "pending" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          En attente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          Échoué
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 dark:text-violet-300 dark:bg-violet-950/60 dark:hover:bg-violet-900/60 rounded-xl transition-colors shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Détails Transaction Complet & Enrichi */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Reçu & Détails de Transaction
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Informations complètes du paiement Mobile Money
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Montant Payé Banner */}
              <div className="bg-linear-to-b from-gray-50 to-gray-100/60 dark:from-gray-700/40 dark:to-gray-800/40 p-5 rounded-2xl text-center border border-gray-200/60 dark:border-gray-700/60 shadow-xs">
                <div className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
                  Montant Réglé
                </div>
                <div className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                  {formatFCFA(selectedTx.amount)}
                </div>
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Transaction Validée & Compte Activé
                  </span>
                </div>
              </div>

              {/* Grid des Détails Enrichis */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                
                {/* Plan / Pack */}
                <div className="p-3.5 bg-gray-50/70 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                  <span className="text-gray-400 uppercase text-[10px] font-bold block mb-1">
                    Formule / Plan
                  </span>
                  <div className="mt-1">
                    {selectedTx.plan === "yearly" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        Plan Annuel (39 900 F)
                      </span>
                    ) : selectedTx.plan === "quarterly" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                        Plan Trimestriel (12 900 F)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                        <Zap className="w-3.5 h-3.5 text-violet-500" />
                        Plan Mensuel (4 900 F)
                      </span>
                    )}
                  </div>
                </div>

                {/* Moyen de Paiement (Wave / Orange Money / etc.) */}
                <div className="p-3.5 bg-gray-50/70 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                  <span className="text-gray-400 uppercase text-[10px] font-bold block mb-1">
                    Moyen de Paiement
                  </span>
                  <div className="mt-1">
                    {renderPaymentMethodBadge(selectedTx.paymentMethod)}
                  </div>
                </div>

                {/* Numéro Saisi lors du Paiement */}
                <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-800/40 col-span-2">
                  <span className="text-emerald-700 dark:text-emerald-400 uppercase text-[10px] font-bold block mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Numéro de Téléphone Saisi (Mobile Money)
                  </span>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {selectedTx.userPhone ? (
                      <span className="font-mono text-emerald-700 dark:text-emerald-300 text-sm">
                        {selectedTx.userPhone}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">
                        Non renseigné par la passerelle
                      </span>
                    )}
                  </div>
                </div>

                {/* Client / Créateur */}
                <div className="p-3.5 bg-gray-50/70 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50 col-span-2">
                  <span className="text-gray-400 uppercase text-[10px] font-bold block mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Client / Compte Utilisateur
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm">
                        {selectedTx.userName}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {selectedTx.userEmail}
                      </div>
                    </div>
                    <code className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                      ID: {selectedTx.userId.substring(0, 10)}...
                    </code>
                  </div>
                </div>

                {/* Référence PayTech */}
                <div className="p-3.5 bg-gray-50/70 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50 col-span-2">
                  <span className="text-gray-400 uppercase text-[10px] font-bold block mb-1 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    Référence de Transaction PayTech
                  </span>
                  <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 mt-1">
                    <code className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400 select-all">
                      {selectedTx.refCommand}
                    </code>
                    <button
                      onClick={() => copyToClipboard(selectedTx.refCommand)}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 bg-gray-50 dark:bg-gray-700 rounded-md transition-colors"
                    >
                      {copiedRef === selectedTx.refCommand ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500">Copié</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Date & Heure */}
                <div className="p-3.5 bg-gray-50/70 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                  <span className="text-gray-400 uppercase text-[10px] font-bold block mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Date & Heure
                  </span>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {selectedTx.createdAt}
                  </div>
                </div>

                {/* Passerelle & Sécurité */}
                <div className="p-3.5 bg-gray-50/70 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
                  <span className="text-gray-400 uppercase text-[10px] font-bold block mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    Passerelle
                  </span>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    PayTech Gateway IPN
                  </div>
                </div>

              </div>
            </div>

            {/* Footer Modal */}
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-5 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
