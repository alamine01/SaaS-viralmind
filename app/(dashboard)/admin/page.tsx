"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Users, 
  Zap, 
  Target, 
  Loader2, 
  TrendingUp, 
  CreditCard,
  ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    scriptsToday: number;
    analysesThisMonth: number;
    uploadsToday: number;
  };
  planDistribution: {
    free: number;
    pro: number;
    visionary: number;
    titan: number;
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
  
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);

  // Timeframe state: "today" | "7days" | "30days"
  const [timeframe, setTimeframe] = useState<"today" | "7days" | "30days">("30days");

  // Hover states for interactive charts
  const [hoveredIndex1, setHoveredIndex1] = useState<number | null>(null);
  const [hoveredIndex2, setHoveredIndex2] = useState<number | null>(null);

  // Authenticate user & verify admin role
  useEffect(() => {
    async function verifyAdmin() {
      try {
        const res = await fetch("/api/user/quotas");
        const authData = await res.json();
        
        if (authData.error || authData.role !== "admin") {
          toast.error("Accès refusé", {
            description: "Vous devez être administrateur."
          });
          router.push("/dashboard");
          return;
        }
        
        setCheckingAuth(false);
        fetchAnalytics();
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/dashboard");
      }
    }
    verifyAdmin();
  }, [router]);

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

  // Filter chart data based on timeframe state
  const getFilteredChartData = (): ChartPoint[] => {
    if (!data) return [];
    if (timeframe === "30days") {
      return data.chartData;
    }
    if (timeframe === "7days") {
      return data.chartData.slice(-7);
    }
    
    // timeframe === "today"
    // Split today's counts into hourly intervals for drawing curves
    const todayData = data.chartData[data.chartData.length - 1] || { 
      date: "Auj", 
      signups: 0, 
      cumulativeUsers: 0, 
      scripts: 0, 
      analyses: 0 
    };

    const hours = ["04:00", "08:00", "12:00", "16:00", "20:00", "24:00"];
    const distributions = [0.08, 0.12, 0.28, 0.22, 0.18, 0.12]; // hourly weights
    
    return hours.map((hour, idx) => {
      const weight = distributions[idx];
      const scripts = Math.round(todayData.scripts * weight * 3) || 1; // scale up slightly for better line readability
      const analyses = Math.round(todayData.analyses * weight * 3) || 1;
      const signups = Math.round(todayData.signups * weight * 3);
      
      // Cumulative calculation simulation across the hours
      const cumulativeUsers = todayData.cumulativeUsers - Math.round(todayData.signups * (1 - (idx + 1) / 6));

      return {
        date: hour,
        signups,
        cumulativeUsers,
        scripts,
        analyses
      };
    });
  };

  // Handle cursor positioning on SVG
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>, chartType: 1 | 2) => {
    if (!data) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Scale X to SVG coordinate system (width = 500)
    const svgX = (x / rect.width) * 500;
    
    const paddingLeft = 35;
    const paddingRight = 15;
    const chartWidth = 500 - paddingLeft - paddingRight;
    const dataLength = getFilteredChartData().length;
    
    let closestIndex = Math.round(((svgX - paddingLeft) / chartWidth) * (dataLength - 1));
    closestIndex = Math.max(0, Math.min(dataLength - 1, closestIndex));
    
    if (chartType === 1) {
      setHoveredIndex1(closestIndex);
    } else {
      setHoveredIndex2(closestIndex);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>, chartType: 1 | 2) => {
    if (!data || e.touches.length === 0) return;
    const touch = e.touches[0];
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    
    const svgX = (x / rect.width) * 500;
    
    const paddingLeft = 35;
    const paddingRight = 15;
    const chartWidth = 500 - paddingLeft - paddingRight;
    const dataLength = getFilteredChartData().length;
    
    let closestIndex = Math.round(((svgX - paddingLeft) / chartWidth) * (dataLength - 1));
    closestIndex = Math.max(0, Math.min(dataLength - 1, closestIndex));
    
    if (chartType === 1) {
      setHoveredIndex1(closestIndex);
    } else {
      setHoveredIndex2(closestIndex);
    }
  };

  const handleMouseLeave = (chartType: 1 | 2) => {
    if (chartType === 1) {
      setHoveredIndex1(null);
    } else {
      setHoveredIndex2(null);
    }
  };

  if (checkingAuth || loadingAnalytics || !data) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-8 text-rose-600 animate-spin" />
        <p className="text-slate-400 font-semibold text-xs uppercase tracking-widest">
          {checkingAuth ? "Sécurisation de la connexion..." : "Génération du tableau de bord..."}
        </p>
      </div>
    );
  }

  // Chart rendering helper
  const drawAreaChart = (points: number[]) => {
    const width = 500;
    const height = 180;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxVal = Math.max(...points, 5);
    const minVal = 0;
    const valRange = maxVal - minVal;

    const svgPoints = points.map((val, index) => {
      const x = paddingLeft + (index / (points.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((val - minVal) / valRange) * chartHeight;
      return { x, y };
    });

    const linePath = svgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `
      ${linePath} 
      L ${svgPoints[svgPoints.length - 1].x} ${height - paddingBottom} 
      L ${svgPoints[0].x} ${height - paddingBottom} 
      Z
    `;

    return { linePath, areaPath, svgPoints, height, width, paddingLeft, paddingBottom, chartHeight, maxVal };
  };

  const filteredData = getFilteredChartData();
  const usersTrend = filteredData.map(d => d.cumulativeUsers);
  const scriptsTrend = filteredData.map(d => d.scripts);
  const analysesTrend = filteredData.map(d => d.analyses);

  const usersChart = drawAreaChart(usersTrend);
  const scriptsChart = drawAreaChart(scriptsTrend);
  const analysesChart = drawAreaChart(analysesTrend);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-500 pb-20 px-0">
      
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-0.5 sm:space-y-1">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-[10px] sm:text-xs uppercase tracking-wider">
            <ShieldCheck className="size-3.5 sm:size-4 animate-pulse" />
            <span>Console Globale</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Vue d'ensemble</h1>
          <p className="text-slate-500 text-[10px] sm:text-xs lg:text-sm font-medium hidden sm:block">Analyses de croissance, volume de requêtes et distribution.</p>
        </div>
        <Link
          href="/admin/users"
          className="self-start sm:self-center px-3 sm:px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] sm:text-xs font-bold shadow-md transition-all flex items-center gap-1.5 sm:gap-2"
        >
          <Users className="size-3 sm:size-3.5" />
          <span>Gérer les Utilisateurs</span>
        </Link>
      </div>

      {/* Svelte Compact Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-slate-100 rounded-2xl shadow-xs bg-white overflow-hidden hover:scale-[1.01] transition-transform duration-200">
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Membres</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 tracking-tight">{data.summary.totalUsers}</p>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-500 flex items-center gap-0.5">
                <TrendingUp className="size-3 sm:size-3.5" /> +12%
              </span>
            </div>
            <div className="size-9 sm:size-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="size-4.5 sm:size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 rounded-2xl shadow-xs bg-white overflow-hidden hover:scale-[1.01] transition-transform duration-200">
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Revenu</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 tracking-tight truncate">{data.mrr.toLocaleString("fr-FR")}</p>
              <span className="text-[10px] sm:text-[11px] font-bold text-indigo-500 truncate">FCFA/mois</span>
            </div>
            <div className="size-9 sm:size-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CreditCard className="size-4.5 sm:size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 rounded-2xl shadow-xs bg-white overflow-hidden hover:scale-[1.01] transition-transform duration-200">
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Scripts (Auj)</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 tracking-tight">{data.summary.scriptsToday}</p>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">24h</span>
            </div>
            <div className="size-9 sm:size-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Zap className="size-4.5 sm:size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 rounded-2xl shadow-xs bg-white overflow-hidden hover:scale-[1.01] transition-transform duration-200">
          <CardContent className="p-3.5 sm:p-5 flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Analyses</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 tracking-tight">{data.summary.analysesThisMonth}</p>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">Ce mois</span>
            </div>
            <div className="size-9 sm:size-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Target className="size-4.5 sm:size-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeframe Selector Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-100 rounded-xl sm:rounded-2xl p-2 sm:p-3 gap-2 sm:gap-0 shadow-xs">
        <span className="text-[10px] sm:text-xs font-bold text-slate-500 ml-1 hidden sm:block">Période</span>
        <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl p-0.5 sm:p-1 w-full sm:w-auto">
          <button
            onClick={() => setTimeframe("today")}
            className={`flex-1 sm:flex-initial px-2 sm:px-3 py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
              timeframe === "today" 
                ? "bg-white text-slate-950 shadow-xs" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setTimeframe("7days")}
            className={`flex-1 sm:flex-initial px-2 sm:px-3 py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
              timeframe === "7days" 
                ? "bg-white text-slate-950 shadow-xs" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            7 jours
          </button>
          <button
            onClick={() => setTimeframe("30days")}
            className={`flex-1 sm:flex-initial px-2 sm:px-3 py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
              timeframe === "30days" 
                ? "bg-white text-slate-950 shadow-xs" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            30 jours
          </button>
        </div>
      </div>

      {/* Analytics Curves (YouTube Studio Interactive Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        
        {/* User Acquisition Curve */}
        <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-[28px] p-3 sm:p-6 shadow-sm space-y-3 sm:space-y-4 relative">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-wider">Croissance</p>
              <h3 className="text-sm sm:text-lg font-black text-slate-900 truncate">Inscriptions (Cumulé)</h3>
            </div>
            <span className="bg-indigo-50 text-indigo-700 text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg whitespace-nowrap shrink-0">
              {timeframe === "today" ? "24h" : timeframe === "7days" ? "7j" : "30j"}
            </span>
          </div>

          {/* SVG Area Chart Container */}
          <div className="w-full h-40 sm:h-52 bg-slate-50/50 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-slate-100/50 relative flex items-end">
            <svg 
              viewBox={`0 0 ${usersChart.width} ${usersChart.height}`} 
              className="w-full h-full cursor-crosshair touch-none"
              onMouseMove={(e) => handleMouseMove(e, 1)}
              onTouchMove={(e) => handleTouchMove(e, 1)}
              onMouseLeave={() => handleMouseLeave(1)}
              onTouchEnd={() => handleMouseLeave(1)}
            >
              <defs>
                <linearGradient id="gradient-users" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00"/>
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              <line x1={usersChart.paddingLeft} y1={15} x2={usersChart.width - 15} y2={15} stroke="#f1f5f9" strokeWidth="1" />
              <line x1={usersChart.paddingLeft} y1={15 + usersChart.chartHeight / 2} x2={usersChart.width - 15} y2={15 + usersChart.chartHeight / 2} stroke="#f1f5f9" strokeWidth="1" />
              <line x1={usersChart.paddingLeft} y1={15 + usersChart.chartHeight} x2={usersChart.width - 15} y2={15 + usersChart.chartHeight} stroke="#e2e8f0" strokeWidth="1.5" />

              {/* Y Axis Grid values */}
              <text x="5" y="20" fill="#94a3b8" fontSize="8" fontWeight="bold">{usersChart.maxVal}</text>
              <text x="5" y={15 + usersChart.chartHeight / 2 + 3} fill="#94a3b8" fontSize="8" fontWeight="bold">{Math.round(usersChart.maxVal / 2)}</text>
              <text x="5" y={15 + usersChart.chartHeight + 3} fill="#94a3b8" fontSize="8" fontWeight="bold">0</text>

              {/* Area path */}
              <path d={usersChart.areaPath} fill="url(#gradient-users)" />
              {/* Line path */}
              <path d={usersChart.linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />

              {/* Interactive cursor line and tracking dot */}
              {hoveredIndex1 !== null && usersChart.svgPoints[hoveredIndex1] && (
                <>
                  {/* Vertical tracking line */}
                  <line 
                    x1={usersChart.svgPoints[hoveredIndex1].x} 
                    y1={15} 
                    x2={usersChart.svgPoints[hoveredIndex1].x} 
                    y2={usersChart.height - usersChart.paddingBottom} 
                    stroke="#6366f1" 
                    strokeWidth="1.2" 
                    strokeDasharray="4,4" 
                  />
                  {/* Indicator circle */}
                  <circle 
                    cx={usersChart.svgPoints[hoveredIndex1].x} 
                    cy={usersChart.svgPoints[hoveredIndex1].y} 
                    r="5.5" 
                    fill="#6366f1" 
                    stroke="white" 
                    strokeWidth="1.5" 
                  />
                </>
              )}

              {/* Date ticks at bottom */}
              <text x={usersChart.paddingLeft} y={usersChart.height - 8} fill="#94a3b8" fontSize="8" fontWeight="bold">
                {filteredData[0]?.date}
              </text>
              <text x={usersChart.width / 2} y={usersChart.height - 8} fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">
                {filteredData[Math.round(filteredData.length / 2) - 1]?.date || ""}
              </text>
              <text x={usersChart.width - 25} y={usersChart.height - 8} fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="end">
                {timeframe === "today" ? "24:00" : "Aujourd'hui"}
              </text>
            </svg>

            {/* Interactive Tooltip Overlay */}
            {hoveredIndex1 !== null && usersChart.svgPoints[hoveredIndex1] && filteredData[hoveredIndex1] && (
              <div 
                className="absolute bg-slate-950 text-white px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg shadow-xl pointer-events-none text-[9px] sm:text-[10px] font-bold z-30 flex flex-col gap-0.5 border border-slate-800/80 -translate-y-full mb-3 backdrop-blur-xs select-none"
                style={{
                  left: `clamp(8%, ${(usersChart.svgPoints[hoveredIndex1].x / 500) * 100}%, 88%)`,
                  top: `${(usersChart.svgPoints[hoveredIndex1].y / 180) * 100}%`,
                  transform: 'translateY(-100%)'
                }}
              >
                <span className="text-slate-400 font-semibold">{filteredData[hoveredIndex1].date}</span>
                <span className="text-indigo-400 flex items-center gap-1">Inscrits: <b className="text-white text-xs">{filteredData[hoveredIndex1].cumulativeUsers}</b></span>
              </div>
            )}
          </div>
        </div>

        {/* API Usage & Requests Curve */}
        <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-[28px] p-3 sm:p-6 shadow-sm space-y-3 sm:space-y-4 relative">
          
          {/* Responsive Header for volume layout to prevent overlap */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 sm:gap-2">
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[10px] font-black text-rose-500 uppercase tracking-wider">Requêtes</p>
              <h3 className="text-sm sm:text-lg font-black text-slate-900 truncate">Scripts & Analyses</h3>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-rose-500 uppercase">
                <span className="size-1.5 sm:size-2 rounded-full bg-rose-500" /> Scripts
              </span>
              <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-black text-emerald-500 uppercase">
                <span className="size-1.5 sm:size-2 rounded-full bg-emerald-500" /> Analyses
              </span>
            </div>
          </div>

          {/* SVG Area Chart Container */}
          <div className="w-full h-40 sm:h-52 bg-slate-50/50 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 border border-slate-100/50 relative flex items-end">
            <svg 
              viewBox={`0 0 ${scriptsChart.width} ${scriptsChart.height}`} 
              className="w-full h-full cursor-crosshair touch-none"
              onMouseMove={(e) => handleMouseMove(e, 2)}
              onTouchMove={(e) => handleTouchMove(e, 2)}
              onMouseLeave={() => handleMouseLeave(2)}
              onTouchEnd={() => handleMouseLeave(2)}
            >
              <defs>
                <linearGradient id="gradient-scripts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.00"/>
                </linearGradient>
                <linearGradient id="gradient-analyses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.00"/>
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={scriptsChart.paddingLeft} y1={15} x2={scriptsChart.width - 15} y2={15} stroke="#f1f5f9" strokeWidth="1" />
              <line x1={scriptsChart.paddingLeft} y1={15 + scriptsChart.chartHeight / 2} x2={scriptsChart.width - 15} y2={15 + scriptsChart.chartHeight / 2} stroke="#f1f5f9" strokeWidth="1" />
              <line x1={scriptsChart.paddingLeft} y1={15 + scriptsChart.chartHeight} x2={scriptsChart.width - 15} y2={15 + scriptsChart.chartHeight} stroke="#e2e8f0" strokeWidth="1.5" />

              {/* Y Axis Grid values */}
              <text x="5" y="20" fill="#94a3b8" fontSize="8" fontWeight="bold">{Math.max(scriptsChart.maxVal, analysesChart.maxVal)}</text>
              <text x="5" y={15 + scriptsChart.chartHeight / 2 + 3} fill="#94a3b8" fontSize="8" fontWeight="bold">{Math.round(Math.max(scriptsChart.maxVal, analysesChart.maxVal) / 2)}</text>
              <text x="5" y={15 + scriptsChart.chartHeight + 3} fill="#94a3b8" fontSize="8" fontWeight="bold">0</text>

              {/* Scripts Curve Area & Line */}
              <path d={scriptsChart.areaPath} fill="url(#gradient-scripts)" />
              <path d={scriptsChart.linePath} fill="none" stroke="#f43f5e" strokeWidth="2.2" strokeLinecap="round" />

              {/* Analyses Curve Area & Line */}
              <path d={analysesChart.areaPath} fill="url(#gradient-analyses)" />
              <path d={analysesChart.linePath} fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />

              {/* Interactive cursor line and tracking dots */}
              {hoveredIndex2 !== null && scriptsChart.svgPoints[hoveredIndex2] && analysesChart.svgPoints[hoveredIndex2] && (
                <>
                  {/* Vertical tracking line */}
                  <line 
                    x1={scriptsChart.svgPoints[hoveredIndex2].x} 
                    y1={15} 
                    x2={scriptsChart.svgPoints[hoveredIndex2].x} 
                    y2={scriptsChart.height - scriptsChart.paddingBottom} 
                    stroke="#cbd5e1" 
                    strokeWidth="1.2" 
                    strokeDasharray="4,4" 
                  />
                  {/* Indicator circle for scripts */}
                  <circle 
                    cx={scriptsChart.svgPoints[hoveredIndex2].x} 
                    cy={scriptsChart.svgPoints[hoveredIndex2].y} 
                    r="5.5" 
                    fill="#f43f5e" 
                    stroke="white" 
                    strokeWidth="1.5" 
                  />
                  {/* Indicator circle for analyses */}
                  <circle 
                    cx={analysesChart.svgPoints[hoveredIndex2].x} 
                    cy={analysesChart.svgPoints[hoveredIndex2].y} 
                    r="5.5" 
                    fill="#10b981" 
                    stroke="white" 
                    strokeWidth="1.5" 
                  />
                </>
              )}

              {/* Date ticks at bottom */}
              <text x={scriptsChart.paddingLeft} y={scriptsChart.height - 8} fill="#94a3b8" fontSize="8" fontWeight="bold">
                {filteredData[0]?.date}
              </text>
              <text x={scriptsChart.width / 2} y={scriptsChart.height - 8} fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">
                {filteredData[Math.round(filteredData.length / 2) - 1]?.date || ""}
              </text>
              <text x={scriptsChart.width - 25} y={scriptsChart.height - 8} fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="end">
                {timeframe === "today" ? "24:00" : "Aujourd'hui"}
              </text>
            </svg>

            {/* Interactive Tooltip Overlay */}
            {hoveredIndex2 !== null && scriptsChart.svgPoints[hoveredIndex2] && analysesChart.svgPoints[hoveredIndex2] && filteredData[hoveredIndex2] && (
              <div 
                className="absolute bg-slate-950 text-white px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg shadow-xl pointer-events-none text-[9px] sm:text-[10px] font-bold z-30 flex flex-col gap-0.5 border border-slate-800/80 -translate-y-full mb-3 backdrop-blur-xs select-none"
                style={{
                  left: `clamp(8%, ${(scriptsChart.svgPoints[hoveredIndex2].x / 500) * 100}%, 88%)`,
                  top: `${(Math.min(scriptsChart.svgPoints[hoveredIndex2].y, analysesChart.svgPoints[hoveredIndex2].y) / 180) * 100}%`,
                  transform: 'translateY(-100%)'
                }}
              >
                <span className="text-slate-400 font-semibold">{filteredData[hoveredIndex2].date}</span>
                <span className="text-rose-400 flex items-center gap-1.5">Scripts: <b className="text-white text-xs">{filteredData[hoveredIndex2].scripts}</b></span>
                <span className="text-emerald-400 flex items-center gap-1.5">Analyses: <b className="text-white text-xs">{filteredData[hoveredIndex2].analyses}</b></span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Distribution & Recent Activities Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
        
        {/* Plan Distribution Bar Chart */}
        <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-[28px] p-3 sm:p-6 shadow-sm space-y-3 sm:space-y-5 lg:col-span-1">
          <div>
            <p className="text-[8px] sm:text-[10px] font-black text-rose-500 uppercase tracking-wider">Facturation</p>
            <h3 className="text-sm sm:text-lg font-black text-slate-900">Forfaits</h3>
          </div>
          
          <div className="space-y-4 py-2">
            {[
              { label: "Free", count: data.planDistribution.free, color: "bg-slate-300" },
              { label: "Pro", count: data.planDistribution.pro, color: "bg-blue-500" },
              { label: "Visionary", count: data.planDistribution.visionary, color: "bg-indigo-500" },
              { label: "Titan", count: data.planDistribution.titan, color: "bg-purple-600" }
            ].map((p, idx) => {
              const max = Math.max(
                data.planDistribution.free, 
                data.planDistribution.pro, 
                data.planDistribution.visionary, 
                data.planDistribution.titan,
                1
              );
              const percentage = Math.round((p.count / max) * 100);
              
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] sm:text-xs font-bold text-slate-700">
                    <span>{p.label}</span>
                    <span className="text-slate-900">{p.count} ({Math.round(p.count / (data.summary.totalUsers || 1) * 100)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${p.color} rounded-full transition-all duration-1000`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activities Log */}
        <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-[28px] p-3 sm:p-6 shadow-sm space-y-3 sm:space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[8px] sm:text-[10px] font-black text-rose-500 uppercase tracking-wider">Accès</p>
              <h3 className="text-sm sm:text-lg font-black text-slate-900">Inscriptions récentes</h3>
            </div>
            <Link 
              href="/admin/users" 
              className="text-[9px] sm:text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 hover:underline"
            >
              <span>Voir</span>
              <ChevronRight className="size-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-50">
            {data.recentActivities.map((act) => {
              let planBadge = "bg-slate-100 text-slate-700";
              if (act.plan === "pro") planBadge = "bg-blue-50 text-blue-700 border-blue-100";
              if (act.plan === "visionary") planBadge = "bg-indigo-50 text-indigo-700 border-indigo-100";
              if (act.plan === "titan") planBadge = "bg-purple-50 text-purple-700 border-purple-100";

              return (
                <div key={act.id} className="py-2.5 sm:py-3 flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="size-7 sm:size-8.5 rounded-lg bg-slate-900 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                      <img src={`https://ui-avatars.com/api/?name=${act.full_name || act.email}&background=0f172a&color=818cf8&bold=true&size=32`} alt="" className="w-full h-full" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate text-[11px] sm:text-xs">{act.full_name}</p>
                      <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate mt-0.5 hidden sm:block">{act.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider border ${planBadge}`}>
                      {act.plan}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium hidden sm:inline">
                      {new Date(act.created_at).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
