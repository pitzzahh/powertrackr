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
  import { onMount } from "svelte";
  import type { RemoteQuery } from "@sveltejs/kit";

  let { current, loading } = $derived<Pick<RemoteQuery<App.Locals>, "current" | "loading">>({
    current: {
      user: null,
      session: null,
    },
    loading: true,
  });

  onMount(() =>
    getAuthUser()
      .then((data) => {
        current = {
          user: data.user,
          session: data.session,
        };
      })
      .finally(() => (loading = false))
  );
</script>

<div class="relative min-h-screen overflow-hidden bg-background">
  <LandingNav {loading} user={current?.user || null} session={current?.session || null} />

  <!-- Hero Section with scroll indicator -->
  <div class="relative">
    <Hero {loading} user={current?.user || null} session={current?.session || null} />
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
      <Cta user={current?.user || null} {loading} />
    </ScrollParallax>
  </div>

  <!-- Footer -->
  <div class="relative">
    <LandingFooter user={current?.user || null} {loading} />
  </div>
</div>
