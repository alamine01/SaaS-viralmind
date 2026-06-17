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
  UserCheck
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
}

interface PlatformStats {
  total: number;
  plans: {
    free: number;
    pro: number;
    visionary: number;
    titan: number;
  };
  roles: {
    admin: number;
    user: number;
  };
}

const PLAN_LIMITS = {
  free: { monthlyAnalysis: 5, dailyScripts: 3, dailyUploads: 3 },
  pro: { monthlyAnalysis: 25, dailyScripts: 10, dailyUploads: 10 },
  visionary: { monthlyAnalysis: 80, dailyScripts: 30, dailyUploads: 25 },
  titan: { monthlyAnalysis: 300, dailyScripts: 9999, dailyUploads: 100 }
};

export default function AdminUsersPage() {
  const router = useRouter();
  
  // Security check & loading states
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  
  // Data states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  
  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlanFilter, setSelectedPlanFilter] = useState("all");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  
  // Edit modal states
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [modalPlan, setModalPlan] = useState("free");
  const [modalRole, setModalRole] = useState("user");
  const [modalScripts, setModalScripts] = useState(0);
  const [modalAnalyses, setModalAnalyses] = useState(0);
  const [modalUploads, setModalUploads] = useState(0);

  // Authenticate user & verify admin role
  useEffect(() => {
    async function verifyAdmin() {
      try {
        const res = await fetch("/api/user/quotas");
        const data = await res.json();
        
        if (data.error || data.role !== "admin") {
          toast.error("Accès refusé", {
            description: "Vous n'avez pas les permissions nécessaires."
          });
          router.push("/dashboard");
          return;
        }
        
        setCheckingAuth(false);
        fetchAdminData();
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/dashboard");
      }
    }
    verifyAdmin();
  }, [router]);

  // Fetch users & stats
  async function fetchAdminData() {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setUsers(data.users || []);
      setStats(data.stats || null);
    } catch (error: any) {
      toast.error("Erreur de chargement", {
        description: error.message || "Impossible de charger les utilisateurs."
      });
    } finally {
      setLoadingUsers(false);
    }
  }

  // Open editing modal and populate values
  const handleEditClick = (user: UserProfile) => {
    setEditingUser(user);
    setModalPlan(user.plan);
    setModalRole(user.role);
    setModalScripts(user.daily_script_count);
    setModalAnalyses(user.monthly_analysis_count);
    setModalUploads(user.daily_upload_count);
  };

  // Reset modal quota values to plan defaults
  const handleResetToPlanDefaults = () => {
    setModalScripts(0);
    setModalAnalyses(0);
    setModalUploads(0);
    toast.info("Compteurs d'utilisation réinitialisés à 0.");
  };

  // Save updated user data
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
          daily_script_count: modalScripts,
          monthly_analysis_count: modalAnalyses,
          daily_upload_count: modalUploads
        })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      toast.success("Utilisateur mis à jour avec succès !");
      setEditingUser(null);
      fetchAdminData();
      
      window.dispatchEvent(new Event("quota-updated"));
    } catch (error: any) {
      toast.error("Erreur de sauvegarde", {
        description: error.message || "Une erreur est survenue."
      });
    } finally {
      setSavingUser(false);
    }
  };

  // Filtered user list
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPlan = selectedPlanFilter === "all" || user.plan.toLowerCase() === selectedPlanFilter.toLowerCase();
    const matchesRole = selectedRoleFilter === "all" || user.role.toLowerCase() === selectedRoleFilter.toLowerCase();
    
    return matchesSearch && matchesPlan && matchesRole;
  });

  if (checkingAuth) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 text-indigo-500 animate-spin" />
        <p className="text-slate-500 font-medium text-sm">Vérification des autorisations admin...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-9xl mx-auto py-8 sm:px-6 lg:px-8 space-y-8">
      
      {/* Page Header (Mosaic Style) */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8 px-4 sm:px-0">
        <div className="mb-4 sm:mb-0">
          <div className="flex items-center gap-2 mb-1">
            <Link 
              href="/admin"
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <h1 className="text-2xl md:text-3xl text-slate-800 font-bold">Gestion des Utilisateurs</h1>
          </div>
          <p className="text-sm text-slate-500 ml-6">Ajustez les abonnements, rôles et consommations de la plateforme.</p>
        </div>
        
        <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
          <button 
            onClick={fetchAdminData}
            disabled={loadingUsers}
            className="btn bg-white border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-600 rounded-lg px-4 py-2 shadow-sm flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loadingUsers ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Stats Cards (Mosaic Style) */}
      {stats && (
        <div className="grid grid-cols-12 gap-6 px-4 sm:px-0">
          <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white shadow-sm rounded-xl border border-slate-200">
            <div className="px-5 pt-5 pb-5">
              <header className="flex justify-between items-start mb-2">
                <div className="size-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <Users className="size-5" />
                </div>
              </header>
              <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Total Utilisateurs</div>
              <div className="flex items-start">
                <div className="text-3xl font-bold text-slate-800 mr-2">{stats.total}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white shadow-sm rounded-xl border border-slate-200">
            <div className="px-5 pt-5 pb-5">
              <header className="flex justify-between items-start mb-2">
                <div className="size-10 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center">
                  <span className="font-bold text-sm">FREE</span>
                </div>
              </header>
              <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Plan Free</div>
              <div className="flex items-start">
                <div className="text-3xl font-bold text-slate-800 mr-2">{stats.plans.free}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white shadow-sm rounded-xl border border-slate-200">
            <div className="px-5 pt-5 pb-5">
              <header className="flex justify-between items-start mb-2">
                <div className="size-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                  <span className="font-bold text-sm">PRO</span>
                </div>
              </header>
              <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Plan Pro</div>
              <div className="flex items-start">
                <div className="text-3xl font-bold text-slate-800 mr-2">{stats.plans.pro}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table Card (Mosaic Style) */}
      <div className="bg-white shadow-sm rounded-xl border border-slate-200 mx-4 sm:mx-0">
        <header className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="font-semibold text-slate-800">Liste des utilisateurs ({filteredUsers.length})</h2>
          
          {/* Filter Options */}
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm font-medium text-slate-800 focus:border-indigo-500 outline-none transition-colors shadow-sm"
              />
            </div>
            
            <select
              value={selectedPlanFilter}
              onChange={(e) => setSelectedPlanFilter(e.target.value)}
              className="bg-white border border-slate-200 text-sm font-medium text-slate-600 rounded-lg px-3 py-2 outline-none shadow-sm focus:border-indigo-500"
            >
              <option value="all">Tous les plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="visionary">Visionary</option>
              <option value="titan">Titan</option>
            </select>

            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="bg-white border border-slate-200 text-sm font-medium text-slate-600 rounded-lg px-3 py-2 outline-none shadow-sm focus:border-indigo-500"
            >
              <option value="all">Tous les rôles</option>
              <option value="user">Utilisateurs</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </header>
        
        <div className="p-3">
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              {/* Table header */}
              <thead className="text-xs font-semibold uppercase text-slate-500 bg-slate-50 border-t border-b border-slate-100">
                <tr>
                  <th className="px-2 py-3 whitespace-nowrap">
                    <div className="font-semibold text-left">Utilisateur</div>
                  </th>
                  <th className="px-2 py-3 whitespace-nowrap">
                    <div className="font-semibold text-left">Plan / Rôle</div>
                  </th>
                  <th className="px-2 py-3 whitespace-nowrap hidden sm:table-cell">
                    <div className="font-semibold text-left">Quotas</div>
                  </th>
                  <th className="px-2 py-3 whitespace-nowrap hidden md:table-cell">
                    <div className="font-semibold text-left">Inscription</div>
                  </th>
                  <th className="px-2 py-3 whitespace-nowrap">
                    <div className="font-semibold text-right">Actions</div>
                  </th>
                </tr>
              </thead>
              {/* Table body */}
              <tbody className="text-sm divide-y divide-slate-100">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <Loader2 className="size-6 text-indigo-500 animate-spin mx-auto" />
                      <p className="text-sm text-slate-500 font-medium mt-2">Chargement...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500 font-medium text-sm">
                      Aucun utilisateur ne correspond à votre recherche.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const limits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
                    
                    // Plan styles
                    let planBadge = "bg-slate-100 text-slate-500";
                    if (user.plan === "pro") planBadge = "bg-emerald-100 text-emerald-600";
                    if (user.plan === "visionary") planBadge = "bg-indigo-100 text-indigo-600";
                    if (user.plan === "titan") planBadge = "bg-purple-100 text-purple-600";

                    // Role styles
                    const roleBadge = user.role === "admin" 
                      ? "bg-rose-100 text-rose-600" 
                      : "bg-slate-100 text-slate-500";

                    const formattedDate = user.created_at 
                      ? new Date(user.created_at).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', year: 'numeric' })
                      : "Inconnue";

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 shrink-0 mr-2 sm:mr-3 rounded-full bg-slate-200">
                              <img className="rounded-full" src={`https://ui-avatars.com/api/?name=${user.full_name || user.email}&background=e2e8f0&color=475569&bold=true&size=40`} alt={user.full_name} />
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">{user.full_name}</div>
                              <div className="text-xs text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className={`text-[10px] inline-flex font-medium rounded-full text-center px-2.5 py-0.5 uppercase ${planBadge}`}>
                              {user.plan}
                            </span>
                            <span className={`text-[10px] inline-flex font-medium rounded-full text-center px-2.5 py-0.5 uppercase ${roleBadge}`}>
                              {user.role}
                            </span>
                          </div>
                        </td>

                        <td className="px-2 py-3 whitespace-nowrap hidden sm:table-cell">
                          <div className="space-y-1 text-xs text-slate-500 w-32">
                            <div className="flex justify-between">
                              <span>Scripts:</span>
                              <span className="font-medium text-slate-700">{user.daily_script_count} / {limits.dailyScripts === 9999 ? "∞" : limits.dailyScripts}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Analyses:</span>
                              <span className="font-medium text-slate-700">{user.monthly_analysis_count} / {limits.monthlyAnalysis}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Uploads:</span>
                              <span className="font-medium text-slate-700">{user.daily_upload_count} / {limits.dailyUploads}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-2 py-3 whitespace-nowrap hidden md:table-cell text-sm text-slate-500">
                          {formattedDate}
                        </td>

                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-right">
                            <button
                              onClick={() => handleEditClick(user)}
                              className="text-slate-400 hover:text-indigo-500 rounded-full p-2 hover:bg-indigo-50 transition-colors"
                              title="Modifier l'utilisateur"
                            >
                              <Edit3 className="size-4" />
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
      </div>

      {/* Editing Modal (Adapted to Mosaic Style) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingUser(null)}
          />
          
          <div className="relative bg-white w-full max-w-lg rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">
                Modifier l'utilisateur
              </h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* User Identity */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <img src={`https://ui-avatars.com/api/?name=${editingUser.full_name || editingUser.email}&background=e2e8f0&color=475569&bold=true&size=40`} alt="" className="rounded-full w-10 h-10" />
                <div>
                  <div className="font-medium text-slate-800">{editingUser.full_name}</div>
                  <div className="text-sm text-slate-500">{editingUser.email}</div>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Forfait actuel</label>
                  <select
                    value={modalPlan}
                    onChange={(e) => setModalPlan(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="visionary">Visionary</option>
                    <option value="titan">Titan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">Rôle d'accès</label>
                  <select
                    value={modalRole}
                    onChange={(e) => setModalRole(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                  >
                    <option value="user">Utilisateur Standard</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-slate-800">Quotas consommés</h4>
                    <button 
                      type="button" 
                      onClick={handleResetToPlanDefaults}
                      className="text-xs font-medium text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                    >
                      <RefreshCw className="size-3" />
                      Remettre à zéro
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-slate-500">Scripts IA (Aujourd'hui)</label>
                      <input
                        type="number"
                        min="0"
                        value={modalScripts}
                        onChange={(e) => setModalScripts(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-slate-500">Analyses (Ce mois)</label>
                      <input
                        type="number"
                        min="0"
                        value={modalAnalyses}
                        onChange={(e) => setModalAnalyses(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-slate-500">Uploads (Aujourd'hui)</label>
                      <input
                        type="number"
                        min="0"
                        value={modalUploads}
                        onChange={(e) => setModalUploads(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-4 border-t border-slate-100 flex gap-3 justify-end bg-slate-50/50">
              <button 
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-slate-200 bg-white hover:border-slate-300 text-slate-600 rounded-lg text-sm font-medium transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={handleSaveUser}
                disabled={savingUser}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm inline-flex items-center gap-2 disabled:opacity-50"
              >
                {savingUser ? <Loader2 className="size-4 animate-spin" /> : <UserCheck className="size-4" />}
                <span>Enregistrer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
