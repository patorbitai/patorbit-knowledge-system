import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import Hero from "@/components/landing/Hero";
import WhyPatorbit from "@/components/landing/WhyPatorbit";
import CoreModel from "@/components/landing/CoreModel";
import Products from "@/components/landing/Products";
import CTA from "@/components/landing/CTA";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="bg-slate-950 text-white">
        <Hero />
        <WhyPatorbit />
        <CoreModel />
        <Products />
        <CTA />
      </main>

      <Footer />
    </>
  );
}