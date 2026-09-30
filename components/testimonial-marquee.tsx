import Image from "next/image";
import Avatar01 from "@/public/images/avatar-01.jpg";
import Avatar02 from "@/public/images/avatar-02.jpg";
import Avatar03 from "@/public/images/avatar-03.jpg";
import Avatar04 from "@/public/images/avatar-04.jpg";
import Avatar05 from "@/public/images/avatar-05.jpg";
import Avatar06 from "@/public/images/avatar-06.jpg";

const testimonials = [
  {
    name: "Lucas Roche",
    role: "Créateur Tech @TechVibe",
    content: "ViralMind a doublé mon nombre d'abonnés en un mois ! L'analyse des hooks est chirurgicale.",
    avatar: Avatar01,
  },
  {
    name: "Sarah Meyer",
    role: "Coach Fitness @FitLife",
    content: "Les scripts générés sont incroyablement précis. Je ne passe plus des heures à chercher des idées.",
    avatar: Avatar02,
  },
  {
    name: "Marc Duboi",
    role: "Influenceur Voyage",
    content: "Le meilleur outil pour YouTube Shorts. Les tendances sont détectées avant tout le monde.",
    avatar: Avatar03,
  },
  {
    name: "Julie Chen",
    role: "Social Media Manager",
    content: "Indispensable pour ma veille quotidienne. ViralMind a transformé notre stratégie TikTok.",
    avatar: Avatar04,
  },
  {
    name: "Thomas Leroy",
    role: "Gamer @LevelUp",
    content: "Gagne un temps fou sur l'écriture des scripts. L'IA comprend vraiment l'audience gaming.",
    avatar: Avatar05,
  },
  {
    name: "Elena Petrov",
    role: "Entrepreneure",
    content: "L'outil parfait pour scaler son contenu. Simple, rapide et surtout très efficace.",
    avatar: Avatar06,
  },
];

export default function TestimonialMarquee() {
  return (
    <section className="py-12 md:py-24 bg-gray-50/50 overflow-hidden" data-aos="fade-up">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 mb-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 md:text-5xl tracking-tight">
          Ils cartonnent avec <span className="text-blue-600">ViralMind</span>
        </h2>
      </div>

      <div className="space-y-8">
        {/* Row 1: Left Scroll */}
        <div className="relative flex w-full">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-gray-50/50 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-gray-50/50 to-transparent z-10 pointer-events-none"></div>
          
          <div className="flex animate-[infinite-scroll_60s_linear_infinite] gap-6 whitespace-nowrap">
            {[...testimonials, ...testimonials, ...testimonials].map((testimonial, index) => (
              <div
                key={index}
                className="flex w-[400px] shrink-0 flex-col gap-4 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
              >
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="size-4 fill-yellow-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[15px] text-gray-700 italic leading-relaxed whitespace-normal font-light">
                  "{testimonial.content}"
                </p>
                <div className="mt-auto flex items-center gap-3">
                  <Image
                    src={testimonial.avatar}
                    width={36}
                    height={36}
                    alt={testimonial.name}
                    className="rounded-full border border-gray-100"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-none">{testimonial.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: Right Scroll */}
        <div className="relative flex w-full">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-gray-50/50 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-gray-50/50 to-transparent z-10 pointer-events-none"></div>

          <div className="flex animate-[infinite-scroll-reverse_60s_linear_infinite] gap-6 whitespace-nowrap">
            {[...testimonials, ...testimonials, ...testimonials].reverse().map((testimonial, index) => (
              <div
                key={index}
                className="flex w-[400px] shrink-0 flex-col gap-4 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
              >
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="size-4 fill-yellow-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[15px] text-gray-700 italic leading-relaxed whitespace-normal font-light">
                  "{testimonial.content}"
                </p>
                <div className="mt-auto flex items-center gap-3">
                  <Image
                    src={testimonial.avatar}
                    width={36}
                    height={36}
                    alt={testimonial.name}
                    className="rounded-full border border-gray-100"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-none">{testimonial.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

  );
}
