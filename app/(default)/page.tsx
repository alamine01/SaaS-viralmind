export const metadata = {
  title: "ViralMind - Devenez Viral sur TikTok & YouTube Shorts",
  description: "Analysez les tendances, générez des scripts IA et boostez votre présence sur les réseaux sociaux avec ViralMind.",
};

import Hero from "@/components/hero-home";
import BusinessCategories from "@/components/business-categories";
import FeaturesPlanet from "@/components/features-planet";
import TestimonialMarquee from "@/components/testimonial-marquee";
import Pricing from "@/components/pricing";
import Faq from "@/components/faq";
import Cta from "@/components/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <BusinessCategories />
      <FeaturesPlanet />
      <Pricing />
      <TestimonialMarquee />
      <Faq />
      <Cta />
    </>
  );
}
