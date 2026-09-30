"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Search, 
  Edit3, 
  X, 
  Loader2, 
  ArrowLeft, 
  RefreshCw, 
  Crown,
  ShieldCheck,
  Zap,
  Phone,
  Bell,
  Check,
  Save,
  CheckCircle2,
  Filter,
  Calendar,
  Sparkles,
  Download,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface UserProfile {
  id: string;
  email: string;
  plan: string;
  full_name: string;
  role: string;
  monthly_analysis_count: number;
  daily_script_count: number;
  daily_upload_count: number;
  created_at: string;
  source?: "mobile" | "web";
  phoneNumber?: string | null;
  pushToken?: string | null;
}

interface PlatformStats {
  total: number;
  mobileTotal?: number;
  webTotal?: number;
  plans: {
    free: number;
    monthly: number;
    quarterly: number;
    yearly: number;
    subscribers: number;
  };
  roles: {
    admin: number;
    user: number;
  };
}

export default function AdminUsersPage() {
  const router = useRouter();
  
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlanFilter, setSelectedPlanFilter] = useState("all");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  
  // Modal state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [modalPlan, setModalPlan] = useState("free");
  const [modalRole, setModalRole] = useState("user");
  const [modalQuotas, setModalQuotas] = useState(3);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUsers(data.users || []);
      setStats(data.stats || null);
    } catch (error: any) {
      toast.error("Erreur de chargement", {
        description: error.message || "Impossible de charger les utilisateurs Firebase."
      });
    } finally {
      setLoadingUsers(false);
    }
  }

  const handleOpenEdit = (u: UserProfile) => {
    setEditingUser(u);
    const plan = u.plan.toLowerCase();
    if (["mensuel", "monthly", "pro"].includes(plan)) {
      setModalPlan("monthly");
    } else if (["trimestriel", "quarterly"].includes(plan)) {
      setModalPlan("quarterly");
    } else if (["annuel", "yearly"].includes(plan)) {
      setModalPlan("yearly");
    } else {
      setModalPlan("free");
    }
    setModalRole(u.role || "user");
    setModalQuotas(u.monthly_analysis_count || 3);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSavingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: modalPlan,
          role: modalRole,
          monthly_analysis_count: modalQuotas
        })
      });

      let data: any = {};
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Erreur serveur (${res.status}): ${text.substring(0, 100)}`);
      }

      if (!res.ok || data.error) {
        throw new Error(data.error || "Impossible d'enregistrer les modifications");
      }

      toast.success("Profil mis à jour", {
        description: `L'utilisateur ${editingUser.email || editingUser.full_name} a été mis à jour avec succès.`
      });

      setUsers(prev => prev.map(u => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            plan: modalPlan,
            role: modalRole,
            monthly_analysis_count: modalQuotas
          };
        }
        return u;
      }));

      setEditingUser(null);
    } catch (error: any) {
      toast.error("Erreur lors de la sauvegarde", {
        description: error.message
      });
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, userNameOrEmail: string) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur "${userNameOrEmail}" de la base de données ?\n\nCette action est irréversible et effacera toutes ses données dans Firebase.`
    );
    if (!confirmed) return;

    setDeletingUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      let data: any = {};
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Erreur serveur (${res.status}): ${text.substring(0, 100)}`);
      }

      if (!res.ok || data.error) {
        throw new Error(data.error || "Impossible de supprimer l'utilisateur");
      }

      toast.success("Utilisateur supprimé", {
        description: `Le compte ${userNameOrEmail} a été définitivement supprimé de la base de données.`,
      });

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (editingUser?.id === userId) {
        setEditingUser(null);
      }
    } catch (err: any) {
      toast.error("Erreur de suppression", {
        description: err.message || "Impossible de supprimer l'utilisateur.",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      toast.error("Aucun créateur à exporter");
      return;
    }
    const headers = ["ID", "Nom", "Email", "Plan", "Role", "Analyses", "Scripts", "Date Inscription", "Source"];
    const rows = filteredUsers.map(u => [
      u.id,
      `"${(u.full_name || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      u.plan,
      u.role,
      u.monthly_analysis_count || 0,
      u.daily_script_count || 0,
      u.created_at ? new Date(u.created_at).toLocaleDateString("fr-FR") : "",
      u.source || "web"
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `viralmind_createurs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Fichier CSV généré et téléchargé !");
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phoneNumber && u.phoneNumber.includes(searchQuery)) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());

    const plan = u.plan.toLowerCase();
    let normalizedPlan = "free";
    if (["mensuel", "monthly", "pro"].includes(plan)) normalizedPlan = "monthly";
    else if (["trimestriel", "quarterly"].includes(plan)) normalizedPlan = "quarterly";
    else if (["annuel", "yearly"].includes(plan)) normalizedPlan = "yearly";

    const matchesPlan = selectedPlanFilter === "all" || normalizedPlan === selectedPlanFilter;
    const matchesRole = selectedRoleFilter === "all" || u.role.toLowerCase() === selectedRoleFilter.toLowerCase();

    return matchesSearch && matchesPlan && matchesRole;
  });

  // Calcul dynamique et fiable des statistiques directement depuis les utilisateurs
  const totalCount = users.length;
  const monthlyCount = users.filter(u => ["mensuel", "monthly", "pro"].includes((u.plan || "").toLowerCase())).length;
  const quarterlyCount = users.filter(u => ["trimestriel", "quarterly"].includes((u.plan || "").toLowerCase())).length;
  const yearlyCount = users.filter(u => ["annuel", "yearly"].includes((u.plan || "").toLowerCase())).length;
  const freeCount = users.filter(u => {
    const p = (u.plan || "").toLowerCase();
    return !["mensuel", "monthly", "pro", "trimestriel", "quarterly", "annuel", "yearly"].includes(p);
  }).length;
  const adminCount = users.filter(u => (u.role || "").toLowerCase() === "admin").length;

  const statCards = [
    {
      label: "Total Créateurs",
      value: totalCount,
      sub: "Inscrits",
      icon: Users,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      pillColor: "bg-blue-50 text-blue-600 border-blue-100",
      badgeText: "Tous",
    },
    {
      label: "Plan Mensuel",
      value: monthlyCount,
      sub: "Abonnés",
      icon: Calendar,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-50",
      pillColor: "bg-blue-50 text-blue-600 border-blue-100",
      badgeText: monthlyCount > 0 ? `${monthlyCount} actif${monthlyCount > 1 ? "s" : ""}` : "0 actif",
    },
    {
      label: "Plan Trimestriel",
      value: quarterlyCount,
      sub: "Abonnés",
      icon: Sparkles,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
      pillColor: "bg-purple-50 text-purple-600 border-purple-100",
      badgeText: quarterlyCount > 0 ? `${quarterlyCount} actif${quarterlyCount > 1 ? "s" : ""}` : "0 actif",
    },
    {
      label: "Plan Annuel",
      value: yearlyCount,
      sub: "Abonnés",
      icon: Crown,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      pillColor: "bg-amber-50 text-amber-600 border-amber-100",
      badgeText: yearlyCount > 0 ? `${yearlyCount} actif${yearlyCount > 1 ? "s" : ""}` : "0 actif",
    },
    {
      label: "Comptes Gratuits",
      value: freeCount,
      sub: "Standard",
      icon: Zap,
      iconColor: "text-gray-500",
      iconBg: "bg-gray-100",
      pillColor: "bg-gray-50 text-gray-500 border-gray-200",
      badgeText: "3 analyses/j",
    },
    {
      label: "Administrateurs",
      value: adminCount,
      sub: "Accès Cockpit",
      icon: ShieldCheck,
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-50",
      pillColor: "bg-indigo-50 text-indigo-600 border-indigo-100",
      badgeText: "Staff",
    },
  ];

  return (
    <div className="space-y-6">

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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                Gestion des Créateurs
              </h1>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                {users.length} inscrits
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Contrôle des plans d'abonnement, quotas et rôles dans Firebase Firestore
            </p>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loadingUsers}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw className={`size-4 ${loadingUsers ? "animate-spin text-blue-500" : ""}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* STATS CARDS (3 cartes par ligne) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-[13px] font-semibold text-gray-600">{card.label}</span>
                <div className={`size-9 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`size-4.5 ${card.iconColor}`} />
                </div>
              </div>

              <div className="mt-1">
                <div className="text-3xl font-extrabold text-gray-800 tracking-tight">
                  {loadingUsers ? (
                    <Loader2 className="size-6 animate-spin text-gray-300" />
                  ) : (
                    card.value
                  )}
                </div>
                
                <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-gray-50">
                  <span className="text-xs text-gray-400 font-medium">{card.sub}</span>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${card.pillColor}`}>
                    {card.badgeText}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SEARCH & FILTERS - 100% Responsive */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="size-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, téléphone ou UID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-700 pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 shrink-0">
            <Filter className="size-3.5 text-blue-500" />
            <span>Filtres :</span>
          </div>

          {/* Plan select */}
          <div className="relative inline-block flex-1 sm:flex-none min-w-[130px]">
            <select
              value={selectedPlanFilter}
              onChange={(e) => setSelectedPlanFilter(e.target.value)}
              className="w-full appearance-none bg-gray-50 text-gray-700 pl-3.5 pr-8 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer shadow-2xs hover:bg-gray-100/80 transition-all"
            >
              <option value="all">Tous les Plans</option>
              <option value="monthly">Plan Mensuel</option>
              <option value="quarterly">Plan Trimestriel</option>
              <option value="yearly">Plan Annuel</option>
              <option value="free">Compte Gratuit</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Role select */}
          <div className="relative inline-block flex-1 sm:flex-none min-w-[125px]">
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="w-full appearance-none bg-gray-50 text-gray-700 pl-3.5 pr-8 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer shadow-2xs hover:bg-gray-100/80 transition-all"
            >
              <option value="all">Tous les Rôles</option>
              <option value="admin">Administrateurs</option>
              <option value="user">Utilisateurs</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            title="Exporter les créateurs filtrés en CSV"
          >
            <Download className="size-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => {
              fetchUsers();
              toast.success("Liste actualisée");
            }}
            disabled={loadingUsers}
            className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 transition-colors cursor-pointer"
            title="Recharger les utilisateurs"
          >
            <RefreshCw className={`size-3.5 ${loadingUsers ? "animate-spin text-blue-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-6 font-medium">Créateur</th>
                <th className="py-3 px-4 font-medium">Plan d'abonnement</th>
                <th className="py-3 px-4 font-medium">Quotas</th>
                <th className="py-3 px-4 font-medium">Rôle</th>
                <th className="py-3 px-4 font-medium">Notifications</th>
                <th className="py-3 px-4 font-medium">Inscrit le</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loadingUsers ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Loader2 className="size-6 animate-spin mx-auto text-blue-500 mb-2" />
                    <span className="text-sm">Chargement des profils...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                    Aucun créateur ne correspond à vos filtres.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const plan = u.plan.toLowerCase();
                  const isMonthly = ["mensuel", "monthly", "pro"].includes(plan);
                  const isQuarterly = ["trimestriel", "quarterly"].includes(plan);
                  const isYearly = ["annuel", "yearly"].includes(plan);
                  const isFree = !isMonthly && !isQuarterly && !isYearly;
                  const isAdmin = u.role.toLowerCase() === "admin";

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 flex items-center gap-2">
                              {u.full_name}
                              {isAdmin && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-600">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[12px] text-gray-400">{u.email}</div>
                            {u.phoneNumber && (
                              <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                <Phone className="size-2.5" />
                                {u.phoneNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isMonthly && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                            <Calendar className="size-3 text-blue-500" />
                            Plan Mensuel
                          </span>
                        )}
                        {isQuarterly && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-600 border border-purple-200">
                            <Sparkles className="size-3 text-purple-500" />
                            Plan Trimestriel
                          </span>
                        )}
                        {isYearly && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                            <Crown className="size-3 text-amber-500" />
                            Plan Annuel
                          </span>
                        )}
                        {isFree && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-500 border border-gray-200">
                            <Zap className="size-3 text-gray-400" />
                            Gratuit
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-gray-700 font-medium">
                          {u.monthly_analysis_count} / jour
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {!isFree ? "Illimité" : "Standard"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isAdmin 
                            ? "bg-purple-100 text-purple-600" 
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-[12px] ${
                          u.pushToken === "Actif" ? "text-emerald-500" : "text-gray-400"
                        }`}>
                          <Bell className="size-3" />
                          {u.pushToken === "Actif" ? "ON" : "OFF"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-gray-400 text-[12px]">
                        {new Date(u.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-all text-xs font-medium"
                          >
                            <Edit3 className="size-3.5" />
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email || u.full_name)}
                            disabled={deletingUserId === u.id}
                            className="inline-flex items-center justify-center size-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all disabled:opacity-50"
                            title="Supprimer définitivement"
                          >
                            {deletingUserId === u.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-500">
                <Edit3 className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  Modifier le profil créateur
                </h3>
                <p className="text-sm text-gray-500">
                  {editingUser.email || editingUser.full_name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              
              {/* Plan */}
              <div>
                <label className="block text-sm text-gray-600 mb-2 font-medium">Plan d'abonnement ViralMind</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setModalPlan("monthly")}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      modalPlan === "monthly"
                        ? "bg-blue-50 border-blue-300 text-blue-700 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <Calendar className="size-4 text-blue-500" />
                      Plan Mensuel
                    </div>
                    {modalPlan === "monthly" && <Check className="size-4 text-blue-500" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalPlan("quarterly")}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      modalPlan === "quarterly"
                        ? "bg-purple-50 border-purple-300 text-purple-700 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <Sparkles className="size-4 text-purple-500" />
                      Plan Trimestriel
                    </div>
                    {modalPlan === "quarterly" && <Check className="size-4 text-purple-500" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalPlan("yearly")}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      modalPlan === "yearly"
                        ? "bg-amber-50 border-amber-300 text-amber-700 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <Crown className="size-4 text-amber-500" />
                      Plan Annuel
                    </div>
                    {modalPlan === "yearly" && <Check className="size-4 text-amber-500" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalPlan("free")}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      modalPlan === "free"
                        ? "bg-gray-100 border-gray-300 text-gray-700 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <Zap className="size-4 text-gray-500" />
                      Gratuit
                    </div>
                    {modalPlan === "free" && <Check className="size-4 text-gray-500" />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm text-gray-600 mb-2 font-medium">Rôle Système</label>
                <select
                  value={modalRole}
                  onChange={(e) => setModalRole(e.target.value)}
                  className="w-full bg-gray-50 text-gray-700 p-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option value="user">Utilisateur (Créateur standard)</option>
                  <option value="admin">Administrateur (Accès au Cockpit)</option>
                </select>
              </div>

              {/* Quotas */}
              <div>
                <label className="block text-sm text-gray-600 mb-2 font-medium">
                  Quotas Quotidiens d'Analyses
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={modalQuotas}
                  onChange={(e) => setModalQuotas(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-gray-50 text-gray-700 p-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
                <p className="text-[12px] text-gray-400 mt-1.5">
                  Recommandé : 3/jour (Gratuit), 30+/jour (Abonnements actifs).
                </p>
              </div>

            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => handleDeleteUser(editingUser.id, editingUser.email || editingUser.full_name)}
                disabled={deletingUserId === editingUser.id}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {deletingUserId === editingUser.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Supprimer le compte
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveUser}
                  disabled={savingUser}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold shadow-sm transition-all"
                >
                  {savingUser ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
