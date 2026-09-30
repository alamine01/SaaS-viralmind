"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Loader2, 
  TrendingUp, 
  CreditCard,
  ChevronRight,
  Sparkles,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Crown,
  Clock,
  Zap,
  FileText,
  Upload,
  Calendar,
  Eye,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  Target,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface ChartPoint {
  date: string;
  signups: number;
  cumulativeUsers: number;
  scripts: number;
  analyses: number;
}

interface AnalyticsData {
  mrr: number;
  summary: {
    totalUsers: number;
    totalSubscribers?: number;
    scriptsToday: number;
    analysesThisMonth: number;
    uploadsToday: number;
  };
  planDistribution: {
    free: number;
    monthly: number;
    quarterly: number;
    yearly: number;
    totalSubscribers: number;
  };
  chartData: ChartPoint[];
  recentActivities: Array<{
    id: string;
    email: string;
    full_name: string;
    plan: string;
    role: string;
    created_at: string;
  }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  type TimeframeOption = "today" | "7days" | "30days" | "90days" | "180days" | "1year";
  const [timeframe, setTimeframe] = useState<TimeframeOption>("7days");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    setLoadingAnalytics(true);
    try {
      const res = await fetch("/api/admin/analytics");
      const resData = await res.json();
      if (resData.error) throw new Error(resData.error);
      setData(resData);
    } catch (error: any) {
      toast.error("Erreur de chargement", {
        description: error.message || "Impossible de charger les données analytiques."
      });
    } finally {
      setLoadingAnalytics(false);
    }
  }

  const handleTimeframeChange = (t: TimeframeOption) => {
    setTimeframe(t);
    setDateDropdownOpen(false);
  };

  const getFilteredChartData = (): ChartPoint[] => {
    if (!data || !data.chartData || data.chartData.length === 0) return [];
    
    if (timeframe === "1year") return data.chartData.slice(-365);
    if (timeframe === "180days") return data.chartData.slice(-180);
    if (timeframe === "90days") return data.chartData.slice(-90);
    if (timeframe === "30days") return data.chartData.slice(-30);
    if (timeframe === "7days") return data.chartData.slice(-7);
    
    const today = data.chartData[data.chartData.length - 1] || { 
      date: "Aujourd'hui", signups: 1, cumulativeUsers: data.summary.totalUsers, scripts: 4, analyses: 6 
    };
    return [
      { date: "00h", signups: 0, cumulativeUsers: Math.max(0, today.cumulativeUsers - 1), scripts: 0, analyses: 0 },
      { date: "06h", signups: 0, cumulativeUsers: Math.max(0, today.cumulativeUsers - 1), scripts: 1, analyses: 1 },
      { date: "12h", signups: Math.min(1, today.signups), cumulativeUsers: today.cumulativeUsers, scripts: 3, analyses: 4 },
      { date: "18h", signups: today.signups, cumulativeUsers: today.cumulativeUsers, scripts: today.scripts, analyses: today.analyses }
    ];
  };

  const chartPoints = getFilteredChartData();
  const maxVal = Math.max(...chartPoints.map(p => p.cumulativeUsers), 4);
  const chartWidth = 680;
  const chartHeight = 210;

  // Calcul des coordonnées
  const pointCoords = chartPoints.map((p, i) => {
    const x = 45 + (i / Math.max(chartPoints.length - 1, 1)) * (chartWidth - 75);
    const y = 25 + (chartHeight - 65) - (p.cumulativeUsers / maxVal) * (chartHeight - 65);
    return { x, y, ...p };
  });

  // Courbe de Bézier fluide (Spline)
  const createSplinePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const splinePath = createSplinePath(pointCoords);
  const areaPath = pointCoords.length > 0 
    ? `${splinePath} L ${pointCoords[pointCoords.length - 1].x},${chartHeight - 35} L ${pointCoords[0].x},${chartHeight - 35} Z`
    : "";

  // Filtre des labels sur l'axe X pour une lisibilité parfaite (6 à 7 labels max)
  const visibleLabelIndices = new Set<number>();
  if (chartPoints.length > 7) {
    const step = Math.floor((chartPoints.length - 1) / 5) || 1;
    for (let i = 0; i < chartPoints.length; i += step) {
      visibleLabelIndices.add(i);
    }
    visibleLabelIndices.add(chartPoints.length - 1);
  } else {
    chartPoints.forEach((_, i) => visibleLabelIndices.add(i));
  }

  const timeframeLabels: Record<TimeframeOption, string> = {
    today: "Aujourd'hui",
    "7days": "7 derniers jours",
    "30days": "30 derniers jours",
    "90days": "3 derniers mois",
    "180days": "6 derniers mois",
    "1year": "1 an",
  };

  const shortTimeframeLabels: Record<TimeframeOption, string> = {
    today: "Aujourd'hui",
    "7days": "7 jours",
    "30days": "30 jours",
    "90days": "3 mois",
    "180days": "6 mois",
    "1year": "1 an",
  };

  // "À traiter" items
  const todoItems = [
    { count: data?.planDistribution.monthly || 0, label: "Plans Mensuels actifs", color: "text-blue-600", bg: "bg-blue-100" },
    { count: data?.planDistribution.quarterly || 0, label: "Plans Trimestriels actifs", color: "text-purple-600", bg: "bg-purple-100" },
    { count: data?.planDistribution.yearly || 0, label: "Plans Annuels actifs", color: "text-amber-600", bg: "bg-amber-100" },
    { count: data?.summary.scriptsToday || 0, label: "Scripts générés aujourd'hui", color: "text-cyan-600", bg: "bg-cyan-100" },
    { count: data?.planDistribution.free || 0, label: "Comptes gratuits", color: "text-gray-600", bg: "bg-gray-100" },
  ];

  // KPI cards config avec calculs dynamiques et garanties anti-vide
  const totalSubscribersCount = (data?.planDistribution?.monthly ?? 0) + (data?.planDistribution?.quarterly ?? 0) + (data?.planDistribution?.yearly ?? 0);

  const kpiCards = [
    {
      label: "Utilisateurs totaux",
      value: data?.summary.totalUsers ?? 0,
      icon: Users,
      trend: "+100%",
      trendUp: true,
      sub: "Inscrits",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      badgeText: "Tous",
      badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
      href: "/admin/users",
    },
    {
      label: "MRR estimé",
      value: `${(data?.mrr ?? 0).toLocaleString("fr-FR")} FCFA`,
      icon: CreditCard,
      trend: "+15%",
      trendUp: true,
      sub: "Revenu mensuel",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
      badgeText: "Revenu",
      badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-100",
      href: "/admin/payments",
    },
    {
      label: "Abonnements actifs",
      value: totalSubscribersCount,
      icon: Crown,
      trend: "+8%",
      trendUp: true,
      sub: "Payants",
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      badgeText: totalSubscribersCount > 0 ? `${totalSubscribersCount} actif${totalSubscribersCount > 1 ? "s" : ""}` : "0 actif",
      badgeColor: "bg-amber-50 text-amber-600 border-amber-100",
      href: "/admin/payments",
    },
    {
      label: "Analyses IA",
      value: data?.summary.analysesThisMonth ?? 0,
      icon: Activity,
      trend: "+33%",
      trendUp: true,
      sub: "Ce mois",
      iconColor: "text-cyan-600",
      iconBg: "bg-cyan-50",
      badgeText: "Activité",
      badgeColor: "bg-cyan-50 text-cyan-600 border-cyan-100",
    },
    {
      label: "Scripts générés",
      value: data?.summary.scriptsToday ?? 0,
      icon: FileText,
      trend: null,
      trendUp: true,
      sub: "Aujourd'hui",
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
      badgeText: "Scripts",
      badgeColor: "bg-purple-50 text-purple-600 border-purple-100",
    },
    {
      label: "Taux de conversion",
      value: (data?.summary.totalUsers ?? 0) > 0 
        ? `${(((totalSubscribersCount) / (data?.summary.totalUsers || 1)) * 100).toFixed(1)}%` 
        : "0%",
      icon: Target,
      trend: "+5.2%",
      trendUp: true,
      sub: `${totalSubscribersCount} converti${totalSubscribersCount > 1 ? "s" : ""}`,
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-50",
      badgeText: "Gratuit → Payant",
      badgeColor: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
  ];

  const currentDate = new Date().toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      
      {/* GREETING BAR WITH FUNCTIONAL DATE PICKER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Bonjour Amine
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Voici un aperçu de l'activité de votre plateforme aujourd'hui.
          </p>
        </div>

        {/* Global Period Filter Dropdown & Refresh Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchAnalytics();
              toast.success("Tableau de bord actualisé");
            }}
            disabled={loadingAnalytics}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm cursor-pointer"
            title="Recharger les métriques en direct"
          >
            <RefreshCw className={`size-4 ${loadingAnalytics ? "animate-spin text-blue-500" : ""}`} />
          </button>

          <div className="relative">
            <button
              onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50/80 transition-all cursor-pointer"
            >
              <Calendar className="size-4 text-blue-500" />
              <span className="font-semibold capitalize">
                {timeframeLabels[timeframe]}
              </span>
              <span className="text-xs text-gray-400">({currentDate})</span>
              <ChevronDown className={`size-4 text-gray-400 transition-transform duration-200 ${dateDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                {(["today", "7days", "30days", "90days", "180days", "1year"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTimeframeChange(t)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      timeframe === t ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{timeframeLabels[t]}</span>
                    {timeframe === t && <span className="size-1.5 rounded-full bg-blue-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI CARDS ROW (3 cartes par ligne) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          const content = (
            <div 
              className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between h-full"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-[13px] font-semibold text-gray-600">{card.label}</span>
                <div className={`size-9 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`size-4.5 ${card.iconColor}`} />
                </div>
              </div>

              <div className="mt-1">
                <div className="text-3xl font-extrabold text-gray-800 tracking-tight">
                  {loadingAnalytics ? (
                    <Loader2 className="size-6 animate-spin text-gray-300" />
                  ) : (
                    card.value
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-gray-50">
                  <span className="text-xs text-gray-400 font-medium">{card.sub}</span>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${card.badgeColor}`}>
                    {card.badgeText}
                  </span>
                </div>
              </div>
            </div>
          );

          return card.href ? (
            <Link key={i} href={card.href} className="block h-full">
              {content}
            </Link>
          ) : (
            <div key={i} className="h-full">
              {content}
            </div>
          );
        })}
      </div>

      {/* ROW 2: CHART + À TRAITER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Card (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <TrendingUp className="size-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">
                  Croissance des utilisateurs
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                    {data?.summary.totalUsers ?? 0}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-0.5">
                    <ArrowUpRight className="size-3" />
                    +18% vs période précédente
                  </span>
                </div>
              </div>
            </div>

            {/* Timeframe Selector Pill Dropdown */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="relative">
                <select
                  value={timeframe}
                  onChange={(e) => handleTimeframeChange(e.target.value as TimeframeOption)}
                  className="appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl pl-3 pr-8 py-2 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                >
                  <option value="today">Aujourd'hui</option>
                  <option value="7days">7 derniers jours</option>
                  <option value="30days">30 derniers jours</option>
                  <option value="90days">3 derniers mois</option>
                  <option value="180days">6 derniers mois</option>
                  <option value="1year">1 an complet</option>
                </select>
                <ChevronDown className="size-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* SVG Smooth Bézier Curve Chart */}
          <div className="px-6 pt-4 pb-2">
            <div className="w-full h-[220px] relative">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                    <stop offset="70%" stopColor="#3B82F6" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.08" />
                  </linearGradient>
                </defs>

                {/* Y-axis grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                  const yPos = 25 + (chartHeight - 65) * (1 - r);
                  const val = Math.round(maxVal * r);
                  return (
                    <g key={i}>
                      <line x1="45" y1={yPos} x2={chartWidth - 25} y2={yPos} stroke="#F1F5F9" strokeDasharray="3 3" strokeWidth="1" />
                      <text x="35" y={yPos + 3.5} textAnchor="end" fill="#94A3B8" fontSize="10" fontWeight="500">{val}</text>
                    </g>
                  );
                })}

                {/* OptiGest Style Subtle Vertical Bars behind points */}
                {pointCoords.map((p, i) => {
                  const barWidth = Math.max(4, Math.min(18, (chartWidth - 80) / pointCoords.length - 6));
                  const isHovered = hoveredIndex === i;
                  return (
                    <rect
                      key={`bar-${i}`}
                      x={p.x - barWidth / 2}
                      y={p.y}
                      width={barWidth}
                      height={chartHeight - 35 - p.y}
                      rx="3"
                      fill="url(#barGradient)"
                      opacity={isHovered ? "0.9" : "0.4"}
                      className="transition-opacity duration-150"
                    />
                  );
                })}

                {/* Area Gradient Fill */}
                {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

                {/* Smooth Curve Line */}
                {splinePath && (
                  <path
                    d={splinePath}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* X-axis non-overlapping labels */}
                {pointCoords.map((p, i) => {
                  if (!visibleLabelIndices.has(i)) return null;
                  return (
                    <text
                      key={`label-${i}`}
                      x={p.x}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      fill="#64748B"
                      fontSize="10.5"
                      fontWeight="500"
                    >
                      {p.date}
                    </text>
                  );
                })}

                {/* Interactive Points on the Curve */}
                {pointCoords.map((p, i) => {
                  const isHovered = hoveredIndex === i;
                  return (
                    <g
                      key={`point-${i}`}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? 6 : 4}
                        fill="white"
                        stroke="#2563EB"
                        strokeWidth="2.5"
                        className="transition-all duration-150"
                      />
                      {isHovered && (
                        <circle cx={p.x} cy={p.y} r={11} fill="#3B82F6" opacity="0.2" />
                      )}
                      {/* Transparent hit area for easy hover */}
                      <circle cx={p.x} cy={p.y} r={16} fill="transparent" />
                    </g>
                  );
                })}
              </svg>

              {/* Rich Floating Tooltip */}
              {hoveredIndex !== null && pointCoords[hoveredIndex] && (
                <div 
                  className="absolute pointer-events-none -translate-x-1/2 top-1 bg-[#152259] text-white rounded-xl px-3.5 py-2 shadow-xl text-xs z-30 border border-white/10"
                  style={{
                    left: `${((pointCoords[hoveredIndex].x) / chartWidth) * 100}%`
                  }}
                >
                  <div className="font-bold text-white text-[12px]">{pointCoords[hoveredIndex].date}</div>
                  <div className="text-blue-200 mt-0.5 font-medium">
                    {pointCoords[hoveredIndex].cumulativeUsers} membre{pointCoords[hoveredIndex].cumulativeUsers > 1 ? "s" : ""}
                  </div>
                  <div className="text-emerald-400 text-[11px] font-semibold mt-0.5">
                    +{pointCoords[hoveredIndex].signups} nouveau{pointCoords[hoveredIndex].signups > 1 ? "x" : ""}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* À traiter aujourd'hui (1/3 width) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-800">À traiter aujourd'hui</h3>
            <Link href="/admin/users" className="text-xs font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
              Voir tout
              <ChevronRight className="size-3" />
            </Link>
          </div>
          <div className="p-4 space-y-2">
            {todoItems.map((item, i) => (
              <Link 
                key={i}
                href="/admin/users"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className={`size-8 rounded-lg ${item.bg} flex items-center justify-center text-sm font-bold ${item.color}`}>
                  {item.count}
                </div>
                <span className="flex-1 text-[13px] font-medium text-gray-700">{item.label}</span>
                <ChevronRight className="size-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3: RECENT USERS TABLE + ACTIONS RAPIDES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Creators Table (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-800 flex items-center gap-2">
              <Users className="size-4 text-blue-500" />
              Créateurs récemment inscrits
            </h3>
            <Link
              href="/admin/users"
              className="text-xs font-medium text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
            >
              Voir tout
              <ChevronRight className="size-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-6 font-medium">Créateur</th>
                  <th className="py-3 px-4 font-medium">Plan d'abonnement</th>
                  <th className="py-3 px-4 font-medium">Statut</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.recentActivities && data.recentActivities.length > 0 ? (
                  data.recentActivities.map((creator) => {
                    const planType = creator.plan.toLowerCase();
                    const isMonthly = planType === "monthly" || planType === "mensuel";
                    const isQuarterly = planType === "quarterly" || planType === "trimestriel";
                    const isYearly = planType === "yearly" || planType === "annuel";
                    const isFree = !isMonthly && !isQuarterly && !isYearly;

                    return (
                      <tr key={creator.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                              {creator.full_name ? creator.full_name.charAt(0).toUpperCase() : "C"}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800 flex items-center gap-2">
                                {creator.full_name}
                                {creator.role === "admin" && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-600">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-[12px] text-gray-400">{creator.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {isMonthly && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                              <Calendar className="size-3 text-blue-500" />
                              Plan Mensuel
                            </span>
                          )}
                          {isQuarterly && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-600 border border-purple-200">
                              <Sparkles className="size-3 text-purple-500" />
                              Plan Trimestriel
                            </span>
                          )}
                          {isYearly && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                              <Crown className="size-3 text-amber-500" />
                              Plan Annuel
                            </span>
                          )}
                          {isFree && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-500 border border-gray-200">
                              <Zap className="size-3 text-gray-400" />
                              Gratuit
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <CheckCircle2 className="size-3" />
                            Actif
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-400 text-[12px]">
                          {new Date(creator.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-400 text-sm">
                      <Loader2 className="size-5 animate-spin mx-auto mb-2 text-blue-400" />
                      Chargement des créateurs...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions Rapides (1/3) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-800">Actions rapides</h3>
          </div>
          <div className="p-4 space-y-2.5">
            <Link
              href="/admin/users"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
            >
              <div className="size-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="size-4 text-blue-500" />
              </div>
              <span className="text-[13px] font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Gérer les créateurs</span>
            </Link>
            <Link
              href="/admin/payments"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group"
            >
              <div className="size-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CreditCard className="size-4 text-emerald-500" />
              </div>
              <span className="text-[13px] font-medium text-gray-700 group-hover:text-emerald-600 transition-colors">Suivre les paiements & Mobile Money</span>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all group"
            >
              <div className="size-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Crown className="size-4 text-amber-500" />
              </div>
              <span className="text-[13px] font-medium text-gray-700 group-hover:text-amber-600 transition-colors">Changer de plan</span>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all group"
            >
              <div className="size-9 rounded-lg bg-purple-50 flex items-center justify-center">
                <Zap className="size-4 text-purple-500" />
              </div>
              <span className="text-[13px] font-medium text-gray-700 group-hover:text-purple-600 transition-colors">Booster les quotas</span>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-cyan-200 hover:bg-cyan-50/50 transition-all group"
            >
              <div className="size-9 rounded-lg bg-cyan-50 flex items-center justify-center">
                <Eye className="size-4 text-cyan-500" />
              </div>
              <span className="text-[13px] font-medium text-gray-700 group-hover:text-cyan-600 transition-colors">Voir les analyses IA</span>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
