<script lang="ts">
  import Logo from "$/components/logo.svelte";
  import { Button } from "$/components/ui/button";
  import { Card, CardDescription, CardHeader, CardTitle } from "$/components/ui/card";
  import { Zap, PhilippinePeso, Banknote } from "$lib/assets/icons";
  import { TextLoop, Magnetic, SplitReveal } from "$lib/motion-core";
</script>

<div
  class="relative flex min-h-screen flex-col overflow-hidden bg-linear-to-br from-background via-background to-muted"
>
  <!-- Animated background blobs -->
  <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>
  </div>

  <!-- Floating particles -->
  <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div class="particle particle-1"></div>
    <div class="particle particle-2"></div>
    <div class="particle particle-3"></div>
    <div class="particle particle-4"></div>
    <div class="particle particle-5"></div>
  </div>

  <!-- Header -->
  <header class="relative z-10 container mx-auto flex items-center justify-between px-4 py-6">
    <Logo
      variant="ghost"
      class="mx-auto w-1/2 px-0 md:m-0 md:w-fit md:pl-0!"
      viewTransitionName="logo"
    />

    <div class="flex gap-2">
      <Magnetic>
        <Button variant="outline" href="/auth?act=login">Login</Button>
      </Magnetic>
      <Magnetic>
        <Button href="/auth?act=register">Sign Up</Button>
      </Magnetic>
    </div>
  </header>

  <!-- Hero Section -->
  <main
    class="relative z-10 container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-12 text-center"
  >
    <div class="w-full max-w-4xl">
      <!-- Badge -->
      <div
        class="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
      >
        <Zap class="h-4 w-4" />
        <span>Smart Electricity Management</span>
      </div>

      <!-- Hero Title - isolated to prevent layout shift -->
      <div class="hero-title-container mb-4">
        <h1 class="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
          Manage{" "}
          <span class="textloop-wrapper">
            <TextLoop
              class="text-primary"
              texts={["Electricity", "Energy", "Power", "Utility"]}
              interval={2500}
            />
          </span>{" "}
          Billing
        </h1>
        <p class="mt-2 text-3xl font-normal text-muted-foreground md:text-4xl lg:text-5xl">
          with ease and precision
        </p>
      </div>

      <p class="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
        Record, organize, and reconcile electricity usage and payments across your account and
        sub-meters. Perfect for landlords, property managers, and multi-unit properties.
      </p>

      <div class="flex flex-col justify-center gap-4 sm:flex-row">
        <Magnetic>
          <Button
            size="lg"
            class="shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
            href="/auth?act=register"
          >
            Get Started Free
          </Button>
        </Magnetic>
        <Magnetic>
          <Button size="lg" variant="outline" href="/auth?act=login">Sign In</Button>
        </Magnetic>
      </div>

      <!-- Features -->
      <div class="mt-16 grid gap-6 md:grid-cols-3">
        <Card
          class="group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
        >
          <div
            class="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          ></div>
          <CardHeader class="relative">
            <div
              class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20"
            >
              <Zap class="h-7 w-7 text-primary" />
            </div>
            <CardTitle class="text-lg">Billing Records</CardTitle>
            <CardDescription>
              Record periodic billing entries with total kWh and balances per billing cycle.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          class="group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
        >
          <div
            class="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          ></div>
          <CardHeader class="relative">
            <div
              class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20"
            >
              <PhilippinePeso class="h-7 w-7 text-primary" />
            </div>
            <CardTitle class="text-lg">Sub-Meter Tracking</CardTitle>
            <CardDescription>
              Support multiple sub-meters per billing period to track each unit's usage separately.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          class="group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
        >
          <div
            class="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          ></div>
          <CardHeader class="relative">
            <div
              class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20"
            >
              <Banknote class="h-7 w-7 text-primary" />
            </div>
            <CardTitle class="text-lg">Payment Reconciliation</CardTitle>
            <CardDescription>
              Associate payments with billing and sub-meter records for clear reconciliation.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="relative z-10 container mx-auto px-4 py-6 text-center text-muted-foreground">
    <p class="text-sm">&copy; {new Date().getFullYear()} PowerTrackr. All rights reserved.</p>
  </footer>
</div>

<style>
  /* Hero title container - fixed height to prevent layout shift */
  .hero-title-container {
    min-height: 180px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  @media (min-width: 768px) {
    .hero-title-container {
      min-height: 220px;
    }
  }

  @media (min-width: 1024px) {
    .hero-title-container {
      min-height: 260px;
    }
  }

  /* TextLoop wrapper - prevent layout shift */
  .textloop-wrapper {
    display: inline-flex;
    justify-content: center;
    vertical-align: baseline;
  }

  /* Animated background blobs */
  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.7;
    animation: blob-float 20s ease-in-out infinite;
  }

  .blob-1 {
    top: -100px;
    right: -100px;
    width: 400px;
    height: 400px;
    background: color-mix(in oklch, var(--primary) 20%, transparent);
  }

  .blob-2 {
    top: 50%;
    left: -150px;
    width: 500px;
    height: 500px;
    background: color-mix(in oklch, var(--primary) 15%, transparent);
    animation-delay: -7s;
  }

  .blob-3 {
    bottom: -100px;
    right: 20%;
    width: 350px;
    height: 350px;
    background: color-mix(in oklch, var(--primary) 18%, transparent);
    animation-delay: -14s;
  }

  @keyframes blob-float {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
    }
    25% {
      transform: translate(40px, -40px) scale(1.1);
    }
    50% {
      transform: translate(-30px, 30px) scale(0.95);
    }
    75% {
      transform: translate(30px, 20px) scale(1.05);
    }
  }

  /* Floating particles */
  .particle {
    position: absolute;
    border-radius: 50%;
    background: color-mix(in oklch, var(--primary) 50%, transparent);
    animation: particle-float 8s ease-in-out infinite;
  }

  .particle-1 {
    top: 15%;
    left: 10%;
    width: 8px;
    height: 8px;
  }

  .particle-2 {
    top: 25%;
    right: 15%;
    width: 12px;
    height: 12px;
    animation-delay: -2s;
    animation-duration: 10s;
  }

  .particle-3 {
    top: 60%;
    left: 20%;
    width: 6px;
    height: 6px;
    animation-delay: -4s;
    animation-duration: 7s;
  }

  .particle-4 {
    top: 40%;
    right: 25%;
    width: 10px;
    height: 10px;
    animation-delay: -1s;
    animation-duration: 9s;
  }

  .particle-5 {
    bottom: 20%;
    left: 30%;
    width: 8px;
    height: 8px;
    animation-delay: -3s;
    animation-duration: 11s;
  }

  @keyframes particle-float {
    0%,
    100% {
      transform: translateY(0) scale(1);
      opacity: 0.4;
    }
    50% {
      transform: translateY(-30px) scale(1.2);
      opacity: 0.8;
    }
  }
</style>
