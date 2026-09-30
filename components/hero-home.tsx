import Image from "next/image";
import { TrendingUp } from "lucide-react";
import PageIllustration from "@/components/page-illustration";
import Avatar01 from "@/public/images/avatar-01.jpg";
import Avatar02 from "@/public/images/avatar-02.jpg";
import Avatar03 from "@/public/images/avatar-03.jpg";
import Avatar04 from "@/public/images/avatar-04.jpg";
import Avatar05 from "@/public/images/avatar-05.jpg";
import Avatar06 from "@/public/images/avatar-06.jpg";

export default function HeroHome() {
  return (
    <section className="relative">
      <PageIllustration />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero content */}
        <div className="pb-12 pt-32 md:pb-20 md:pt-40">
          {/* Section header */}
          <div className="pb-12 text-center md:pb-16">
            <div
              className="mb-6 border-y [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-300/.8),transparent)1]"
              data-aos="zoom-y-out"
            >
              <div className="-mx-0.5 flex justify-center -space-x-3">
                <Image
                  className="box-content rounded-full border-2 border-gray-50"
                  src={Avatar01}
                  width={32}
                  height={32}
                  alt="Avatar 01"
                />
                <Image
                  className="box-content rounded-full border-2 border-gray-50"
                  src={Avatar02}
                  width={32}
                  height={32}
                  alt="Avatar 01"
                />
                <Image
                  className="box-content rounded-full border-2 border-gray-50"
                  src={Avatar03}
                  width={32}
                  height={32}
                  alt="Avatar 02"
                />
                <Image
                  className="box-content rounded-full border-2 border-gray-50"
                  src={Avatar04}
                  width={32}
                  height={32}
                  alt="Avatar 03"
                />
                <Image
                  className="box-content rounded-full border-2 border-gray-50"
                  src={Avatar05}
                  width={32}
                  height={32}
                  alt="Avatar 04"
                />
                <Image
                  className="box-content rounded-full border-2 border-gray-50"
                  src={Avatar06}
                  width={32}
                  height={32}
                  alt="Avatar 05"
                />
              </div>
            </div>
            <h1
              className="mb-6 text-4xl font-extrabold tracking-tight md:text-6xl text-gray-900 leading-[1.1]"
              data-aos="zoom-y-out"
              data-aos-delay={150}
            >
              Devenez Viral sur{" "}
              <span className="relative px-2">
                <span className="relative z-10">TikTok</span>
                <span className="absolute bottom-1 left-0 h-3 w-full bg-blue-200/50 -rotate-1 rounded-sm z-0 animate-[expand_0.8s_ease-out_0.6s_both] origin-left"></span>
              </span>{" "}
              & <br className="max-lg:hidden" />
              <span className="relative inline-block">
                YouTube Shorts
                <svg className="absolute -bottom-2 left-0 w-full h-2 text-blue-500/40" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path 
                    d="M0 5 Q 25 0, 50 5 T 100 5" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    className="animate-[draw_1.2s_ease-out_1s_both]"
                    style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
                  />
                </svg>
              </span>{" "}
              avec l'IA
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className="mb-8 text-lg text-gray-700"
                data-aos="zoom-y-out"
                data-aos-delay={300}
              >
                ViralMind analyse les tendances en temps réel, décortique les vidéos qui cartonnent 
                et génère vos prochains scripts à succès en quelques secondes.
              </p>
              <div className="relative before:absolute before:inset-0 before:border-y before:[border-image:linear-gradient(to_right,transparent,--theme(--color-slate-300/.8),transparent)1]">
                <div
                  className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center"
                  data-aos="zoom-y-out"
                  data-aos-delay={450}
                >
                  <a
                    className="btn group mb-4 w-full bg-linear-to-t from-blue-600 to-blue-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-sm hover:bg-[length:100%_150%] sm:mb-0 sm:w-auto"
                    href="/signup"
                  >
                    <span className="relative inline-flex items-center">
                      Commencer Gratuitement{" "}
                      <span className="ml-1 tracking-normal text-blue-300 transition-transform group-hover:translate-x-0.5">
                        -&gt;
                      </span>
                    </span>
                  </a>
                  <a
                    className="btn w-full bg-white text-gray-800 shadow-sm hover:bg-gray-50 sm:ml-4 sm:w-auto"
                    href="/feed"
                  >
                    Voir le Feed Viral
                  </a>
                </div>
              </div>
            </div>
          </div>
          {/* Hero image */}
          <div
            className="mx-auto max-w-3xl"
            data-aos="zoom-y-out"
            data-aos-delay={600}
          >
            <div className="relative aspect-auto md:aspect-video rounded-2xl bg-[#0A0A0B] p-4 md:p-6 shadow-2xl ring-1 ring-white/10 overflow-hidden group animate-[reveal-3d_1.2s_cubic-bezier(0.23,1,0.32,1)_both]">
              {/* Background Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur-2xl group-hover:opacity-30 transition-opacity"></div>
              
              <div className="relative h-full flex flex-col md:flex-row gap-6">
                {/* Video Preview Mockup */}
                <div className="relative w-full md:w-1/3 aspect-square md:h-full rounded-xl overflow-hidden border border-white/10 shadow-lg animate-[fade-in_0.8s_ease-out_both]">
                  <Image
                    src="/hero-preview.png"
                    alt="Video Preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                    <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="w-2/3 h-full bg-blue-500 animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                </div>

                {/* Analysis Data Mockup */}
                <div className="flex-1 flex flex-col gap-3 py-2">
                  <div className="flex items-center justify-between animate-[fade-in_0.5s_ease-out_0.4s_both]">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                      Analyse IA en cours...
                    </span>
                    <div className="flex gap-1">
                      <div className="size-2 rounded-full bg-red-500/50"></div>
                      <div className="size-2 rounded-full bg-yellow-500/50"></div>
                      <div className="size-2 rounded-full bg-green-500/50"></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Card 1 */}
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between animate-[reveal-up_0.6s_ease-out_0.6s_both] hover:bg-white/10 transition-colors cursor-pointer group/card">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-blue-600/20 flex items-center justify-center group-hover/card:bg-blue-600/30 transition-colors">
                          <span className="text-blue-400 text-xs font-bold">H</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white">Score de l'Accroche</p>
                          <p className="text-[10px] text-gray-500">Basé sur les 3 premières secondes</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-blue-400">98%</span>
                    </div>

                    {/* Card 2 */}
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between animate-[reveal-up_0.6s_ease-out_0.8s_both] hover:bg-white/10 transition-colors cursor-pointer group/card">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-green-600/20 flex items-center justify-center group-hover/card:bg-green-600/30 transition-colors">
                          <span className="text-green-400 text-xs font-bold">V</span>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white">Potentiel Viral</p>
                          <p className="text-[10px] text-gray-500">Comparé à 10k+ vidéos</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-green-400">Élevé</span>
                    </div>

                    {/* Card 3 */}
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 shadow-lg space-y-2 animate-[reveal-up_0.6s_ease-out_1s_both] hover:bg-white/10 transition-colors cursor-pointer group/card border-l-purple-500/50">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-tighter flex items-center gap-1">
                          <TrendingUp className="size-3" />
                          Script IA Suggéré
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300 italic leading-relaxed line-clamp-2 group-hover/card:text-white transition-colors">
                        "Arrêtez tout ! Si vous voulez vraiment exploser sur TikTok, il y a une seule règle que vous ignorez..."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
