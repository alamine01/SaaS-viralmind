"use client"

import { Activity, Play, Zap, FileText, Magnet, Heart, TrendingUp } from "lucide-react"

export default function FeaturesPlanet() {
  const features = [
    { name: "Rétention", desc: "74% à 15s", icon: Activity, color: "bg-amber-500", pos: "top-[-30px] left-[50%] -translate-x-1/2 md:top-[10px] md:left-[55%]", delay: "0s" },
    { name: "YouTube Shorts", desc: "Fitness", icon: Play, color: "bg-red-500", pos: "top-[60px] right-[-10px] md:top-[120px] md:right-[15%]", delay: "1.2s" },
    { name: "Hook Analysis", desc: "98/100", icon: Magnet, color: "bg-indigo-500", pos: "bottom-[120px] right-[-10px] md:bottom-[180px] md:right-[10%]", delay: "2.4s" },
    { name: "Engagement", desc: "+15.4% / jour", icon: Heart, color: "bg-fuchsia-500", pos: "bottom-[-30px] left-[50%] -translate-x-1/2 md:bottom-[30px] md:left-[52%]", delay: "0.8s" },
    { name: "Script IA", desc: "Success: 92%", icon: FileText, color: "bg-emerald-500", pos: "bottom-[120px] left-[-10px] md:bottom-[200px] md:left-[12%]", delay: "1.6s" },
    { name: "TikTok Trend", desc: "Motivation", icon: Zap, color: "bg-blue-500", pos: "top-[80px] left-[-10px] md:top-[150px] md:left-[18%]", delay: "3s" },
  ]

  return (
    <section className="bg-[#0b0f19] py-32 overflow-hidden border-t border-slate-900">
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative flex justify-center items-center h-[500px] md:h-[800px]">
          
          {/* THE ULTIMATE 3D SPHERE */}
          <div className="relative size-[380px] md:size-[680px] flex items-center justify-center">
            
            <div className="absolute inset-0 bg-indigo-500/10 blur-[140px] rounded-full" />
            
            <div className="absolute inset-0 rounded-full bg-[#0d1321] shadow-[0_0_120px_rgba(79,70,229,0.2)] overflow-hidden border border-indigo-500/10">
               
               <div 
                 className="absolute inset-0 opacity-[0.15] mix-blend-screen"
                 style={{ 
                    backgroundImage: 'url("https://www.transparenttextures.com/patterns/world-map.png")',
                    backgroundSize: '1000px',
                    backgroundRepeat: 'repeat-x',
                    animation: 'rotateMap 80s linear infinite'
                 }} 
               />

               <div className="absolute inset-0 bg-radial-gradient(circle at center, rgba(79,70,229,0.4) 0%, rgba(79,70,229,0.1) 40%, transparent 70%)" />
               
               <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i}
                      className="absolute size-1 bg-indigo-400 rounded-full animate-pulse blur-[1px]"
                      style={{ 
                        top: `${Math.random() * 80 + 10}%`, 
                        left: `${Math.random() * 80 + 10}%`,
                        animationDelay: `${Math.random() * 3}s`
                      }}
                    />
                  ))}
               </div>

               <div className="absolute inset-0 bg-radial-gradient(circle at center, transparent 30%, rgba(11,15,25,0.8) 90%)" />
               
               <div className="absolute inset-0 rounded-full border-2 border-indigo-400/10 shadow-[inset_0_0_60px_rgba(79,70,229,0.4)]" />
               
               <div className="absolute top-[10%] left-[10%] size-[30%] bg-white/5 blur-3xl rounded-full" />
            </div>

            <div className="relative z-10 size-16 md:size-28 rounded-full bg-slate-900/40 backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_rgba(79,70,229,0.3)] flex items-center justify-center group cursor-pointer transition-all duration-500 hover:scale-105">
               <TrendingUp className="size-8 md:size-14 text-indigo-300 group-hover:text-white transition-colors duration-500" />
               <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl animate-pulse" />
            </div>
          </div>

          {/* Floating Feature Cards with Animation */}
          {features.map((feature, i) => (
            <div 
              key={i} 
              className={`absolute z-20 ${feature.pos} transition-all duration-700`}
              style={{ 
                animation: `floatCard 4s ease-in-out infinite`,
                animationDelay: feature.delay 
              }}
            >
              <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/5 p-3 md:p-5 rounded-[28px] shadow-2xl flex items-center gap-4 hover:border-indigo-500/40 hover:bg-slate-800/60 transition-all group cursor-pointer">
                <div className={`size-10 md:size-14 rounded-2xl ${feature.color} flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                   <feature.icon className="size-5 md:size-7 text-white fill-current" />
                </div>
                <div className="pr-6">
                  <p className="text-white text-[14px] md:text-[16px] font-bold tracking-tight">{feature.name}</p>
                  <p className="text-slate-400 text-[10px] md:text-[12px] font-semibold mt-1 uppercase tracking-[0.1em]">{feature.desc}</p>
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>

      <style jsx>{`
        @keyframes rotateMap {
          from { background-position: 0 0; }
          to { background-position: 1000px 0; }
        }
        @keyframes floatCard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .bg-radial-gradient {
          background-image: radial-gradient(var(--tw-gradient-stops));
        }
      `}</style>
    </section>
  )
}
