import { SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";
import { LandingMarquee } from "@/components/landing/landing-marquee";
import { ProductDemo } from "@/components/landing/product-demo";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { SiteFooter } from "@/components/landing/site-footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <LandingMarquee />
        <ProductDemo />
        <FeatureGrid />
      </main>
      <SiteFooter />
    </div>
  );
}
