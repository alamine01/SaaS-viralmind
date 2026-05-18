import Link from "next/link";
import Image from "next/image";

export default function Cta() {
  return (
    <section className="relative py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative bg-slate-900 rounded-[3rem] py-16 md:py-24 px-8 md:px-16 shadow-2xl overflow-hidden group">
          
          {/* Background Illustration */}
          <div
            className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"
            aria-hidden="true"
          >
            <div className="size-96 bg-indigo-500 rounded-full" />
          </div>

          <div className="relative flex flex-col lg:flex-row justify-between items-center gap-10">
            <div className="text-center lg:text-left space-y-6 max-w-xl">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                Boostez votre présence virale avec ViralMind
              </h2>
              <p className="text-slate-400 text-lg font-medium leading-relaxed">
                Rejoignez des milliers de créateurs qui utilisent l'IA pour dominer TikTok et YouTube Shorts.
              </p>
            </div>

            <div className="shrink-0">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-10 py-5 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 hover:shadow-indigo-500/40 transition-all group/btn"
              >
                Essayer gratuitement
                <svg
                  className="w-3 h-3 fill-current text-white shrink-0 ml-3 transition-transform group-hover/btn:translate-x-1"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.602 11l-.875-.864L9.33 6.534H0V5.382h9.33L5.727 1.812l.875-.884L12 6l-5.398 5z"
                    fillRule="nonzero"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
