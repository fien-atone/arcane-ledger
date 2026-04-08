/**
 * LandingPage — public marketing page (Tier 3 top-level page).
 *
 * Composes the fixed nav, hero, stats strip, features grid, roadmap,
 * contact block, final CTA and the shared Footer. All content lives in
 * the `widgets/landing/sections/` section widgets — this file is pure
 * composition with no data fetching or state of its own.
 */
import { Footer } from '@/shared/ui';
import {
  LandingNavSection,
  LandingHeroSection,
  LandingStatsSection,
  LandingFeaturesSection,
  LandingRoadmapSection,
  LandingContactSection,
  LandingCtaSection,
} from '@/widgets/landing/sections';

export default function LandingPage() {
  return (
    <div className="bg-background text-on-background min-h-screen">
      <LandingNavSection />

      <main className="max-w-6xl mx-auto px-8">
        <LandingHeroSection />
        <LandingStatsSection />
        <LandingFeaturesSection />
        <LandingRoadmapSection />
        <LandingContactSection />
        <LandingCtaSection />
      </main>

      <Footer />
    </div>
  );
}
