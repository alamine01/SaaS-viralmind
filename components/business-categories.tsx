import { 
  Video, 
  Flame, 
  Dumbbell, 
  Briefcase, 
  GraduationCap, 
  Gamepad2, 
  Utensils, 
  Palmtree, 
  Shirt,
  TrendingUp
} from "lucide-react";

export default function BusinessCategories() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pb-12 md:pb-20">
          {/* Tab panels */}
          <div className="relative flex h-[300px] md:h-[324px] items-center justify-center overflow-hidden md:overflow-visible">
            {/* Small blue dots and glow (keep existing SVGs for background) */}
            <div className="absolute -z-10" data-aos="fade" data-aos-delay={400}>
              <svg className="fill-blue-500" xmlns="http://www.w3.org/2000/svg" width={164} height={41} viewBox="0 0 164 41" fill="none">
                <circle cx={1} cy={8} r={1} fillOpacity="0.24" /><circle cx={1} cy={1} r={1} fillOpacity="0.16" /><circle cx={1} cy={15} r={1} /><circle cx={1} cy={26} r={1} fillOpacity="0.64" /><circle cx={1} cy={33} r={1} fillOpacity="0.24" /><circle cx={8} cy={8} r={1} /><circle cx={8} cy={15} r={1} /><circle cx={8} cy={26} r={1} fillOpacity="0.24" /><circle cx={15} cy={15} r={1} fillOpacity="0.64" /><circle cx={15} cy={26} r={1} fillOpacity="0.16" /><circle cx={8} cy={33} r={1} /><circle cx={1} cy={40} r={1} />
                <circle cx={1} cy={1} r={1} transform="matrix(-1 0 0 1 164 7)" fillOpacity="0.24" /><circle cx={1} cy={1} r={1} transform="matrix(-1 0 0 1 164 0)" fillOpacity="0.16" /><circle cx={1} cy={1} r={1} transform="matrix(-1 0 0 1 164 14)" /><circle cx={1} cy={1} r={1} transform="matrix(-1 0 0 1 164 25)" fillOpacity="0.64" /><circle cx={1} cy={1} r={1} transform="matrix(-1 0 0 1 164 32)" fillOpacity="0.24" /><circle cx={1} cy={1} r={1} transform="matrix(-1 0 0 1 157 7)" /><circle cx={1} cy={1} r={1} transform="matrix(-1 0 0 1 157 14)" /><circle cx={1} cy={1} r={1} transform="matrix(-1 0 0 1 157 25)" fillOpacity="0.24" /><circle cx={1} cy={1} r={1} transform="matrix(-1 0 0 1 150 14)" fillOpacity="0.64" /><circle cx={1} cy={1} r={1} transform="matrix(-1 0 0 1 150 25)" fillOpacity="0.16" /><circle cx={1} cy={1} r={1} transform="matrix(-1 0 0 1 157 32)" /><circle cx={1} cy={1} r={1} transform="matrix(-1 0 0 1 164 39)" />
              </svg>
            </div>
            <div className="absolute -z-10" data-aos="zoom-in" data-aos-delay={200}>
              <svg xmlns="http://www.w3.org/2000/svg" width={432} height={160} viewBox="0 0 432 160" fill="none">
                <g opacity="0.6" filter="url(#filter0_f_2044_9)">
                  <path className="fill-blue-500" fillRule="evenodd" clipRule="evenodd" d="M80 112C62.3269 112 48 97.6731 48 80C48 62.3269 62.3269 48 80 48C97.6731 48 171 62.3269 171 80C171 97.6731 97.6731 112 80 112ZM352 112C369.673 112 384 97.6731 384 80C384 62.3269 369.673 48 352 48C334.327 48 261 62.3269 261 80C261 97.6731 334.327 112 352 112Z" />
                </g>
                <defs><filter id="filter0_f_2044_9" x={0} y={0} width={432} height={160} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity={0} result="BackgroundImageFix" /><feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feGaussianBlur stdDeviation={32} result="effect1_foregroundBlur_2044_9" /></filter></defs>
              </svg>
            </div>

            {/* Central Logo - ViralMind */}
            <div className="absolute before:absolute before:-inset-3 before:animate-[spin_3s_linear_infinite] before:rounded-full before:border before:border-transparent before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] before:[background:conic-gradient(from_180deg,transparent,var(--color-blue-500))_border-box]" data-aos="zoom-in" data-aos-delay={100}>
              <div className="animate-[breath_8s_ease-in-out_infinite_both]">
                <div className="flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-full bg-white shadow-xl shadow-blue-500/10 before:absolute before:inset-0 before:m-[8.334%] before:rounded-[inherit] before:border before:border-gray-700/5 before:bg-gray-200/60 before:[mask-image:linear-gradient(to_bottom,black,transparent)]">
                  <TrendingUp className="relative size-8 md:size-10 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="relative flex flex-col">
              <article className="flex h-full w-full items-center justify-center">
                {/* TikTok Icon */}
                <div className="absolute -translate-x-[100px] md:-translate-x-[136px]" data-aos="fade-right" data-aos-delay={300}>
                  <div className="animate-[breath_7s_ease-in-out_3s_infinite_both]">
                    <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-white shadow-lg before:absolute before:inset-0 before:m-[8.334%] before:rounded-[inherit] before:border before:border-gray-700/5 before:bg-gray-200/60 before:[mask-image:linear-gradient(to_bottom,black,transparent)]">
                      <svg className="relative size-6 md:size-8 fill-black" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1 .05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* YouTube Icon */}
                <div className="absolute translate-x-[100px] md:translate-x-[136px]" data-aos="fade-left" data-aos-delay={350}>
                  <div className="animate-[breath_7s_ease-in-out_3.5s_infinite_both]">
                    <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-white shadow-lg before:absolute before:inset-0 before:m-[8.334%] before:rounded-[inherit] before:border before:border-gray-700/5 before:bg-gray-200/60 before:[mask-image:linear-gradient(to_bottom,black,transparent)]">
                      <svg className="relative size-5 md:size-7 fill-[#FF0000]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Fitness Niche */}
                <div className="absolute -translate-x-[150px] -translate-y-[60px] md:-translate-x-[216px] md:-translate-y-[82px]" data-aos="zoom-in" data-aos-delay={400}>
                  <div className="animate-[breath_6s_ease-in-out_3.5s_infinite_both]">
                    <div className="flex h-14 w-14 md:h-20 md:w-20 items-center justify-center rounded-full bg-white shadow-lg before:absolute before:inset-0 before:m-[8.334%] before:rounded-[inherit] before:border before:border-gray-700/5 before:bg-gray-200/60 before:[mask-image:linear-gradient(to_bottom,black,transparent)]">
                      <Dumbbell className="relative size-6 md:size-8 text-blue-500" />
                    </div>
                  </div>
                </div>

                {/* Business Niche */}
                <div className="absolute -translate-y-[60px] translate-x-[150px] md:-translate-y-[82px] md:translate-x-[216px]" data-aos="zoom-in" data-aos-delay={450}>
                  <div className="animate-[breath_6s_ease-in-out_1.5s_infinite_both]">
                    <div className="flex h-14 w-14 md:h-20 md:w-20 items-center justify-center rounded-full bg-white shadow-lg before:absolute before:inset-0 before:m-[8.334%] before:rounded-[inherit] before:border before:border-gray-700/5 before:bg-gray-200/60 before:[mask-image:linear-gradient(to_bottom,black,transparent)]">
                      <Briefcase className="relative size-6 md:size-8 text-indigo-500" />
                    </div>
                  </div>
                </div>

                {/* Education Niche */}
                <div className="absolute translate-x-[150px] translate-y-[60px] md:translate-x-[216px] md:translate-y-[82px]" data-aos="zoom-in" data-aos-delay={500}>
                  <div className="animate-[breath_6s_ease-in-out_2s_infinite_both]">
                    <div className="flex h-14 w-14 md:h-20 md:w-20 items-center justify-center rounded-full bg-white shadow-lg before:absolute before:inset-0 before:m-[8.334%] before:rounded-[inherit] before:border before:border-gray-700/5 before:bg-gray-200/60 before:[mask-image:linear-gradient(to_bottom,black,transparent)]">
                      <GraduationCap className="relative size-6 md:size-8 text-emerald-500" />
                    </div>
                  </div>
                </div>

                {/* Gaming Niche */}
                <div className="absolute -translate-x-[150px] translate-y-[60px] md:-translate-x-[216px] md:translate-y-[82px]" data-aos="zoom-in" data-aos-delay={550}>
                  <div className="animate-[breath_6s_ease-in-out_2.5s_infinite_both]">
                    <div className="flex h-14 w-14 md:h-20 md:w-20 items-center justify-center rounded-full bg-white shadow-lg before:absolute before:inset-0 before:m-[8.334%] before:rounded-[inherit] before:border before:border-gray-700/5 before:bg-gray-200/60 before:[mask-image:linear-gradient(to_bottom,black,transparent)]">
                      <Gamepad2 className="relative size-6 md:size-8 text-purple-500" />
                    </div>
                  </div>
                </div>

                {/* Food Niche - Hidden on small mobile */}
                <div className="absolute -translate-x-[292px] hidden lg:block opacity-40" data-aos="fade" data-aos-delay={600}>
                  <div className="animate-[breath_6s_ease-in-out_2s_infinite_both]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200/60 bg-white shadow-lg">
                      <Utensils className="relative size-5 text-orange-500" />
                    </div>
                  </div>
                </div>

                {/* Travel Niche - Hidden on small mobile */}
                <div className="absolute translate-x-[292px] hidden lg:block opacity-40" data-aos="fade" data-aos-delay={650}>
                  <div className="animate-[breath_6s_ease-in-out_4s_infinite_both]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200/60 bg-white shadow-lg">
                      <Palmtree className="relative size-5 text-sky-500" />
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
