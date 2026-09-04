import Hero from "@/components/marketing/Hero";
import SocialProof from "@/components/marketing/SocialProof";
import Problem from "@/components/marketing/Problem";
import HowItWorks from "@/components/marketing/HowItWorks";
import FeatureGrid from "@/components/marketing/FeatureGrid";
import TrustScoreDemo from "@/components/marketing/TrustScoreDemo";
import ProfessionalPassport from "@/components/marketing/ProfessionalPassport";
import WhyPatorbit from "@/components/marketing/WhyPatorbit";
import ComparisonTable from "@/components/marketing/ComparisonTable";
import CTA from "@/components/marketing/CTA";

export default function HomePage() {
  return (
    <main className="bg-[#070B14] text-white">
      <Hero />
      <SocialProof />
      <Problem />
      <HowItWorks />
      <FeatureGrid />
      <TrustScoreDemo />
      <ProfessionalPassport />
      <WhyPatorbit />
      <ComparisonTable />
      <CTA />
    </main>
  );
}
