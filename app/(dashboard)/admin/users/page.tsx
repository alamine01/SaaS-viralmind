"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
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
import { Card, CardContent } from "@/components/ui/card";
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
        <Loader2 className="size-8 text-indigo-600 animate-spin" />
        <p className="text-slate-400 font-medium">Vérification des autorisations admin...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-20 px-0">
      
      {/* Navigation Header */}
      <div className="flex items-center gap-3">
        <Link 
          href="/admin"
          className="p-2 bg-white border border-slate-100 hover:bg-slate-50 text-slate-600 rounded-xl transition-all shadow-xs"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span className="text-slate-400 text-xs font-bold">Retour au Tableau de bord Admin</span>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-0.5 sm:space-y-1">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-[10px] sm:text-xs uppercase tracking-wider">
            <Users className="size-3.5 sm:size-4" />
            <span>Gestion Utilisateurs</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Utilisateurs</h1>
          <p className="text-slate-500 text-[10px] sm:text-xs lg:text-sm font-medium hidden sm:block">Ajustez les abonnements, rôles et consommations.</p>
        </div>
        <button 
          onClick={fetchAdminData}
          disabled={loadingUsers}
          className="self-start sm:self-center px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] sm:text-xs font-bold shadow-md transition-all flex items-center gap-1.5 sm:gap-2 disabled:opacity-50"
        >
          {loadingUsers ? <Loader2 className="size-3 sm:size-3.5 animate-spin" /> : <RefreshCw className="size-3 sm:size-3.5" />}
          <span>Actualiser</span>
        </button>
          </div>
 
      {/* Responsive Stats Cards Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="border border-slate-100 rounded-2xl shadow-sm bg-white overflow-hidden">
            <CardContent className="p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4">
              <div className="size-9 sm:size-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Users className="size-4.5 sm:size-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Total</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 rounded-2xl shadow-sm bg-white overflow-hidden">
            <CardContent className="p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4">
              <div className="size-9 sm:size-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <span className="font-black text-[10px] sm:text-xs tracking-tight">FREE</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Free</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{stats.plans.free}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 rounded-2xl shadow-sm bg-white overflow-hidden">
            <CardContent className="p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4">
              <div className="size-9 sm:size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <span className="font-black text-[10px] sm:text-xs tracking-tight">PRO</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Pro</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{stats.plans.pro}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 rounded-2xl shadow-sm bg-white overflow-hidden">
            <CardContent className="p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4">
              <div className="size-9 sm:size-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <span className="font-black text-[10px] sm:text-xs tracking-tight">VISI</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Visionary</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{stats.plans.visionary}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 rounded-2xl shadow-sm bg-white overflow-hidden col-span-2 sm:col-span-1">
            <CardContent className="p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4">
              <div className="size-9 sm:size-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                <span className="font-black text-[10px] sm:text-xs tracking-tight">TITAN</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Titan</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">{stats.plans.titan}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white border border-slate-100 rounded-xl sm:rounded-[28px] p-3 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
        
        {/* Responsive Filters */}
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row items-stretch lg:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 sm:size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-semibold text-slate-900 focus:border-indigo-500 outline-hidden transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 flex-1 sm:flex-initial">
              <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Plan</span>
              <select
                value={selectedPlanFilter}
                onChange={(e) => setSelectedPlanFilter(e.target.value)}
                className="bg-transparent border-0 text-[11px] sm:text-xs font-semibold text-slate-700 outline-hidden w-full focus:ring-0"
              >
                <option value="all">Tous</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="visionary">Visionary</option>
                <option value="titan">Titan</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 flex-1 sm:flex-initial">
              <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Rôle</span>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="bg-transparent border-0 text-[11px] sm:text-xs font-semibold text-slate-700 outline-hidden w-full focus:ring-0"
              >
                <option value="all">Tous</option>
                <option value="user">Membres</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Responsive Table Wrapper */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl sm:rounded-2xl -mx-3 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="px-3 sm:px-6 py-3 sm:py-4">Utilisateur</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4">Plan</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">Quotas</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">Inscription</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <Loader2 className="size-6 text-rose-600 animate-spin mx-auto" />
                      <p className="text-xs text-slate-400 font-bold mt-2">Chargement de la liste...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400 font-semibold text-xs">
                      Aucun utilisateur trouvé correspondant aux critères.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const limits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
                    
                    // Plan styles
                    let planStyle = "bg-slate-100 text-slate-700";
                    if (user.plan === "pro") planStyle = "bg-blue-50 text-blue-700 border border-blue-100";
                    if (user.plan === "visionary") planStyle = "bg-indigo-50 text-indigo-700 border border-indigo-100";
                    if (user.plan === "titan") planStyle = "bg-purple-50 text-purple-700 border border-purple-100";

                    // Role styles
                    const roleStyle = user.role === "admin" 
                      ? "bg-rose-50 text-rose-700 border border-rose-100" 
                      : "bg-slate-50 text-slate-600 border border-slate-100";

                    const formattedDate = user.created_at 
                      ? new Date(user.created_at).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', year: 'numeric' })
                      : "Inconnue";

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors text-[11px] sm:text-xs font-semibold text-slate-700">
                        {/* User Info */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4.5">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="size-7 sm:size-9 rounded-lg sm:rounded-xl bg-slate-900 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                              <img src={`https://ui-avatars.com/api/?name=${user.full_name || user.email}&background=0f172a&color=818cf8&bold=true&size=32`} alt="" className="w-full h-full" />
                            </div>
                            <div className="min-w-0 max-w-[100px] sm:max-w-none">
                              <p className="font-bold text-slate-900 truncate text-[11px] sm:text-xs">{user.full_name}</p>
                              <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium truncate mt-0.5 hidden sm:block">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Plan / Role Badges */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4.5">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-wider ${planStyle}`}>
                              {user.plan}
                            </span>
                            <span className={`px-1 sm:px-1.5 py-0.5 rounded-full text-[7px] sm:text-[9px] font-black uppercase tracking-wider ${roleStyle}`}>
                              {user.role}
                            </span>
                          </div>
                        </td>

                        {/* Quota values */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4.5 hidden sm:table-cell">
                          <div className="space-y-1 w-28 sm:w-40 text-[9px] sm:text-[10px] font-bold text-slate-500">
                            <div className="flex justify-between items-center">
                              <span>Scripts :</span>
                              <span className="text-slate-800">{user.daily_script_count} / {limits.dailyScripts === 9999 ? "∞" : limits.dailyScripts}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Analyses :</span>
                              <span className="text-slate-800">{user.monthly_analysis_count} / {limits.monthlyAnalysis}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Uploads :</span>
                              <span className="text-slate-800">{user.daily_upload_count} / {limits.dailyUploads}</span>
                            </div>
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4.5 text-slate-500 hidden md:table-cell">
                          {formattedDate}
                        </td>

                        {/* Actions */}
                        <td className="px-3 sm:px-6 py-3 sm:py-4.5 text-right">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="p-1.5 sm:p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg sm:rounded-xl transition-all inline-flex items-center justify-center"
                            title="Modifier"
                          >
                            <Edit3 className="size-3.5 sm:size-4" />
                          </button>
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

      {/* Editing Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-300"
            onClick={() => setEditingUser(null)}
          />
          
          <div className="relative bg-white w-full sm:max-w-md rounded-t-[24px] sm:rounded-[32px] p-4 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[85vh] sm:max-h-[90vh] flex flex-col z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -z-10" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 mb-4 sm:mb-5 shrink-0">
              <div>
                <span className="text-[9px] sm:text-[10px] font-black text-rose-600 uppercase tracking-widest">Configuration</span>
                <h3 className="text-base sm:text-xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
                  Modifier
                </h3>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                className="size-7 sm:size-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all border border-slate-100"
              >
                <X className="size-3.5 sm:size-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="space-y-4 sm:space-y-5 overflow-y-auto pr-1 py-1 flex-1 text-slate-700 text-xs">
              {/* User Identity Banner */}
              <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <div className="size-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                  <img src={`https://ui-avatars.com/api/?name=${editingUser.full_name || editingUser.email}&background=0f172a&color=818cf8&bold=true`} alt="" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{editingUser.full_name}</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate mt-0.5">{editingUser.email}</p>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-4">
                {/* Plan Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Forfait</label>
                  <select
                    value={modalPlan}
                    onChange={(e) => setModalPlan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-950 focus:border-rose-500 outline-hidden transition-all"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="visionary">Visionary</option>
                    <option value="titan">Titan</option>
                  </select>
                </div>

                {/* Role Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Rôle d'accès</label>
                  <select
                    value={modalRole}
                    onChange={(e) => setModalRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-950 focus:border-rose-500 outline-hidden transition-all"
                  >
                    <option value="user">Utilisateur (Standard)</option>
                    <option value="admin">Administrateur (Accès total)</option>
                  </select>
                </div>

                <div className="h-px bg-slate-100 my-2" />

                {/* Quotas Customization */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Consommation Actuelle</span>
                    <button 
                      type="button" 
                      onClick={handleResetToPlanDefaults}
                      className="text-[9px] font-black text-rose-600 hover:text-rose-750 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="size-2.5" />
                      Remettre à zéro
                    </button>
                  </div>

                  {/* Scripts Quota */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 ml-1">Scripts IA consommés (Aujourd'hui)</span>
                    <input
                      type="number"
                      min="0"
                      value={modalScripts}
                      onChange={(e) => setModalScripts(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-955 focus:border-rose-500 outline-hidden transition-all"
                    />
                  </div>

                  {/* Analyses Quota */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 ml-1">Analyses consommées (Ce mois)</span>
                    <input
                      type="number"
                      min="0"
                      value={modalAnalyses}
                      onChange={(e) => setModalAnalyses(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-955 focus:border-rose-500 outline-hidden transition-all"
                    />
                  </div>

                  {/* Uploads Quota */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 ml-1">Uploads consommés (Aujourd'hui)</span>
                    <input
                      type="number"
                      min="0"
                      value={modalUploads}
                      onChange={(e) => setModalUploads(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-955 focus:border-rose-500 outline-hidden transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-4 border-t border-slate-100 mt-5 flex gap-3 shrink-0">
              <button 
                onClick={() => setEditingUser(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-center"
              >
                Annuler
              </button>
              <button 
                onClick={handleSaveUser}
                disabled={savingUser}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {savingUser ? <Loader2 className="size-3.5 animate-spin" /> : <UserCheck className="size-3.5" />}
                <span>Enregistrer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
