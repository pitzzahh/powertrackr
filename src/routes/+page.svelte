<script lang="ts">
  import {
    Features,
    Hero,
    HowItWorks,
    LandingFooter,
    LandingNav,
    Scenarios,
  } from "#routes/(components)/landing/index.js";
</script>

<div class="min-h-screen bg-background">
  <LandingNav />

  <main>
    <Hero />
    <HowItWorks />
    <Features />
    <Scenarios />
  </main>

  <LandingFooter />
</div>
