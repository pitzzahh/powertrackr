<script lang="ts">
  import {
    BenefitsMarquee,
    Cta,
    Features,
    Hero,
    HowItWorks,
    LandingFooter,
    LandingNav,
    Scenarios,
    Stats,
  } from "./(components)";
  import { ScrollParallax } from "$lib/motion-core";
  import { getAuthUser } from "$/api/auth.remote";

  let { user, session } = await getAuthUser();
</script>

<div class="relative min-h-screen overflow-hidden bg-background">
  <LandingNav {user} {session} />

  <!-- Hero Section with scroll indicator -->
  <div class="relative">
    <Hero {user} {session} />
  </div>

  <!-- Benefits Marquee - Visual break with movement -->
  <BenefitsMarquee />

  <!-- How It Works Section -->
  <div class="relative">
    <div class="absolute inset-0 bg-linear-to-b from-transparent via-muted/20 to-transparent"></div>
    <HowItWorks />
  </div>

  <!-- Stats Section with parallax offset -->
  <ScrollParallax speed={0.01}>
    <Stats />
  </ScrollParallax>

  <!-- Features Section - Alternate background with enhanced texture -->
  <div class="relative bg-muted/20">
    <Features />
  </div>

  <div class="bg-muted/50">
    <Scenarios />
  </div>

  <!-- CTA Section - With dramatic separators and parallax -->
  <div class="relative">
    <ScrollParallax speed={0.05} fade opacityFrom={0.8} opacityTo={1}>
      <Cta {user} />
    </ScrollParallax>
  </div>

  <!-- Footer -->
  <div class="relative">
    <LandingFooter {user} />
  </div>
</div>
