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
</script>

<div class="relative min-h-screen overflow-hidden bg-background">
  <AnimatedBackground />
  <LandingNav />

  <!-- Hero Section -->
  <Hero />

  <!-- Benefits Marquee - Visual break with movement -->
  <BenefitsMarquee />

  <!-- How It Works Section -->
  <div class="relative">
    <div class="absolute inset-0 bg-linear-to-b from-transparent via-muted/20 to-transparent"></div>
    <HowItWorks />
  </div>

  <!-- Stats Section - Already has border-y and bg-muted/30 -->
  <Stats />

  <!-- Scenarios Section - With top decoration -->
  <div class="relative">
    <!-- Top wave/curve separator -->
    <div
      class="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-border to-transparent"
    ></div>
    <!-- Subtle background gradient -->
    <div class="absolute inset-0 bg-linear-to-b from-muted/10 via-transparent to-muted/10"></div>
    <!-- Decorative orbs -->
    <div class="absolute top-20 left-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl"></div>
    <div class="absolute right-1/4 bottom-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl"></div>
    <Scenarios />
    <div
      class="absolute inset-x-0 -bottom-px h-px bg-linear-to-r from-transparent via-border to-transparent"
    ></div>
  </div>

  <!-- Features Section - Alternate background -->
  <div class="relative bg-muted/20">
    <!-- Grid pattern overlay for texture -->
    <div
      class="absolute inset-0 opacity-[0.02]"
      style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cpath d=&quot;M54 48H6v-6h48v6zm0-18H6v-6h48v6zm0-18H6V6h48v6z&quot; fill=&quot;%23fff&quot; fill-opacity=&quot;1&quot; fill-rule=&quot;evenodd&quot;/%3E%3C/svg%3E');"
    ></div>
    <Features />
  </div>

  <!-- CTA Section - With dramatic separators -->
  <div class="relative">
    <!-- Top gradient separator -->
    <div class="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-muted/20 to-transparent"></div>
    <!-- Decorative elements -->
    <div class="absolute top-1/3 left-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl"></div>
    <div class="absolute right-10 bottom-1/3 h-32 w-32 rounded-full bg-primary/10 blur-2xl"></div>
    <Cta />
  </div>

  <!-- Footer -->
  <div class="relative">
    <div
      class="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border to-transparent"
    ></div>
    <LandingFooter />
  </div>
</div>
