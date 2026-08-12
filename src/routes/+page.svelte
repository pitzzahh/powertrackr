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

  let { data } = $props();
</script>

<div class="relative min-h-screen overflow-hidden bg-background">
  <LandingNav user={data.user} session={data.session} />

  <main>
    <Hero user={data.user} session={data.session} />

    <BenefitsMarquee />

    <HowItWorks />

    <ScrollParallax speed={0.01}>
      <Stats />
    </ScrollParallax>

    <Features />

    <Scenarios />

    <div class="relative">
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border/80 to-transparent"
        aria-hidden="true"
      ></div>
      <ScrollParallax speed={0.05} fade opacityFrom={0.8} opacityTo={1}>
        <Cta user={data.user} />
      </ScrollParallax>
    </div>
  </main>

  <LandingFooter user={data.user} />
</div>
