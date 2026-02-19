<script lang="ts">
  import {
    AnimatedBackground,
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
  <AnimatedBackground />

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
    <!-- Animated accent line -->
    <div class="absolute inset-x-0 top-0 flex justify-center">
      <div class="h-px w-1/2 bg-linear-to-r from-transparent via-primary/40 to-transparent"></div>
    </div>
    <HowItWorks />
  </div>

  <!-- Stats Section with parallax offset -->
  <ScrollParallax speed={0.1}>
    <Stats />
  </ScrollParallax>

  <!-- Scenarios Section - With enhanced decorations -->
  <div class="relative">
    <!-- Top wave/curve separator -->
    <div
      class="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-border to-transparent"
    ></div>
    <!-- Subtle background gradient -->
    <div class="absolute inset-0 bg-linear-to-b from-muted/10 via-transparent to-muted/10"></div>
    <!-- Decorative orbs with animation -->
    <div
      class="absolute top-20 left-1/4 h-64 w-64 animate-pulse rounded-full bg-primary/5 blur-3xl"
    ></div>
    <div
      class="absolute right-1/4 bottom-20 h-64 w-64 animate-pulse rounded-full bg-primary/5 blur-3xl"
      style="animation-delay: 1s;"
    ></div>
    <!-- Floating accent elements -->
    <div
      class="absolute top-1/2 left-10 hidden h-20 w-20 rotate-45 rounded-lg border border-primary/10 lg:block"
    ></div>
    <div
      class="absolute top-1/3 right-10 hidden h-16 w-16 rotate-12 rounded-full border border-primary/10 lg:block"
    ></div>
    <Scenarios />
    <div
      class="absolute inset-x-0 -bottom-px h-px bg-linear-to-r from-transparent via-border to-transparent"
    ></div>
  </div>

  <!-- Features Section - Alternate background with enhanced texture -->
  <div class="relative bg-muted/20">
    <!-- Grid pattern overlay for texture -->
    <div
      class="absolute inset-0 opacity-[0.02]"
      style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cpath d=&quot;M54 48H6v-6h48v6zm0-18H6v-6h48v6zm0-18H6V6h48v6z&quot; fill=&quot;%23fff&quot; fill-opacity=&quot;1&quot; fill-rule=&quot;evenodd&quot;/%3E%3C/svg%3E');"
    ></div>
    <!-- Corner accents -->
    <div
      class="absolute top-0 left-0 h-32 w-32 bg-linear-to-br from-primary/5 to-transparent"
    ></div>
    <div
      class="absolute right-0 bottom-0 h-32 w-32 bg-linear-to-tl from-primary/5 to-transparent"
    ></div>
    <Features />
  </div>

  <!-- CTA Section - With dramatic separators and parallax -->
  <div class="relative">
    <!-- Top gradient separator -->
    <div class="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-muted/20 to-transparent"></div>
    <!-- Decorative elements with subtle animation -->
    <div
      class="absolute top-1/3 left-10 h-32 w-32 animate-pulse rounded-full bg-primary/10 blur-2xl"
    ></div>
    <div
      class="absolute right-10 bottom-1/3 h-32 w-32 animate-pulse rounded-full bg-primary/10 blur-2xl"
      style="animation-delay: 0.5s;"
    ></div>
    <!-- Diagonal accent lines -->
    <div
      class="absolute top-1/4 left-1/4 hidden h-px w-40 rotate-45 bg-linear-to-r from-transparent via-primary/20 to-transparent lg:block"
    ></div>
    <div
      class="absolute right-1/4 bottom-1/4 hidden h-px w-40 -rotate-45 bg-linear-to-r from-transparent via-primary/20 to-transparent lg:block"
    ></div>
    <ScrollParallax speed={0.05} fade opacityFrom={0.8} opacityTo={1}>
      <Cta {user} />
    </ScrollParallax>
  </div>

  <!-- Footer -->
  <div class="relative">
    <div
      class="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border to-transparent"
    ></div>
    <LandingFooter {user} />
  </div>
</div>
