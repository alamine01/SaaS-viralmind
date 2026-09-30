import Logo from "@/components/ui/logo";
import PageIllustration from "@/components/page-illustration";
import { TrendingUp, Zap, Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden bg-gray-50">
      <header className="absolute z-30 w-full">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between md:h-20">
            {/* Site branding */}
            <div className="mr-4 shrink-0">
              <Logo />
            </div>
          </div>
        </div>
      </header>

      <main className="relative flex grow">
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <PageIllustration />
        </div>

        {/* Content */}
        <div className="w-full">
          <div className="flex h-full flex-col justify-center before:min-h-[4rem] before:flex-1 after:flex-1 md:before:min-h-[5rem]">
            <div className="px-4 sm:px-6">
              <div className="mx-auto w-full max-w-sm">
                <div className="py-16 md:py-20">{children}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side decoration - Premium Light Preview */}
        <div className="relative my-6 mr-6 hidden w-[572px] shrink-0 overflow-hidden rounded-[32px] bg-slate-50 shadow-2xl ring-1 ring-slate-200 lg:block overflow-hidden group" aria-hidden="true">
          {/* Subtle Background Gradients */}
          <div className="absolute top-0 -left-1/4 size-96 bg-blue-100/40 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 -right-1/4 size-96 bg-indigo-100/40 blur-[100px] rounded-full" />
          
          <div className="absolute inset-0 flex flex-col p-12 justify-center">
            {/* The "Wow" Factor: Hyper-Modern Overlapping Dashboard */}
            <div className="relative w-full h-[500px]">
               {/* 1. Background Main Card (The Engine) */}
               <div className="absolute top-10 left-0 w-[90%] h-[400px] rounded-[48px] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-slate-100 p-10 animate-[reveal-3d_1s_ease-out_both]">
                  <div className="flex justify-between items-start mb-12">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Moteur Neural v4.0</p>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tight">Analyse Active</h4>
                     </div>
                     <div className="size-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white shadow-xl shadow-slate-900/20 rotate-3 hover:rotate-0 transition-transform">
                        <Sparkles className="size-6 text-indigo-400" />
                     </div>
                  </div>

                  <div className="relative h-28 w-full mt-4 group">
                     {/* SVG Curved Graph */}
                     <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100">
                        {/* Area Fill Gradient */}
                        <defs>
                           <linearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                           </linearGradient>
                        </defs>
                        
                        {/* The Fill Area */}
                        <path 
                           d="M0,80 Q50,20 100,60 T200,40 T300,70 T400,30 L400,100 L0,100 Z" 
                           fill="url(#graphGradient)"
                           className="animate-[expand_3s_ease-in-out_infinite_alternate] origin-bottom"
                        />
                        
                        {/* The Line */}
                        <path 
                           d="M0,80 Q50,20 100,60 T200,40 T300,70 T400,30" 
                           fill="none" 
                           stroke="#4f46e5" 
                           strokeWidth="3" 
                           strokeLinecap="round"
                           strokeDasharray="1000"
                           strokeDashoffset="1000"
                           className="animate-[draw_3s_ease-in-out_infinite_alternate]"
                        />
                        
                        {/* Animated Data Points */}
                        {[
                          { x: 50, y: 35, val: "40%" },
                          { x: 150, y: 50, val: "70%" },
                          { x: 300, y: 70, val: "45%" }
                        ].map((pt, i) => (
                           <g key={i} className={`animate-in fade-in duration-1000 delay-[${(i+1)*500}ms]`}>
                              <circle cx={pt.x} cy={pt.y} r="4" fill="white" stroke="#4f46e5" strokeWidth="2" />
                              <foreignObject x={pt.x - 20} y={pt.y - 30} width="40" height="20">
                                 <div className="text-[8px] font-black text-indigo-600 bg-white border border-slate-100 shadow-sm rounded-full text-center">
                                    {pt.val}
                                 </div>
                              </foreignObject>
                           </g>
                        ))}
                     </svg>
                  </div>
                     
                     <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                        <div className="flex -space-x-3">
                           {[1,2,3].map(n => (
                             <div key={n} className="size-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                                <img src={`https://i.pravatar.cc/100?img=${n + 10}`} alt="" />
                             </div>
                           ))}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">+1.2k Analysés aujourd'hui</p>
                     </div>
                  </div>

               {/* 2. Overlapping Glass Card (The Result) */}
               <div className="absolute top-[160px] right-0 w-[260px] p-6 rounded-[32px] bg-indigo-600 shadow-[0_30px_70px_rgba(79,70,229,0.3)] border border-indigo-400/30 text-white animate-[float_4s_infinite_ease-in-out] backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="size-8 rounded-xl bg-white/20 flex items-center justify-center">
                        <Zap className="size-4" />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest">Score Viral</span>
                  </div>
                  <div className="space-y-1">
                     <p className="text-5xl font-black italic tracking-tighter">98.2</p>
                     <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Optimisation Max</p>
                  </div>
                  <div className="mt-6 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                     <div className="h-full bg-white w-4/5 animate-[expand-x_3s_ease-in-out_infinite_alternate] origin-left"></div>
                  </div>
               </div>

               {/* 3. Floating Mini Card (The Platform) */}
               <div className="absolute bottom-[40px] left-[40px] px-6 py-4 rounded-2xl bg-white shadow-2xl border border-slate-100 flex items-center gap-4 animate-[float_5s_infinite_ease-in-out_1s]">
                  <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center">
                     <TrendingUp className="size-5 text-indigo-600" />
                  </div>
                  <div>
                     <p className="text-xs font-black text-slate-900 leading-none">Radar TikTok</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Tendances Actuelles</p>
                  </div>
               </div>

               {/* Decorative Dots / Lines */}
               <div className="absolute top-0 right-10 size-20 bg-indigo-500/10 blur-3xl rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
