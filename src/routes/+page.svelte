<script lang="ts">
  import Logo from "$/components/logo.svelte";
  import { Button } from "$/components/ui/button";
  import { Card, CardDescription, CardHeader, CardTitle } from "$/components/ui/card";
  import {
    Zap,
    PhilippinePeso,
    Banknote,
    ChartLine,
    Users,
    Shield,
    Clock,
    CheckCircle,
  } from "$lib/assets/icons";
  import { TextLoop, Magnetic, SplitReveal, Marquee } from "$lib/motion-core";

  const benefits = [
    "Real-time Tracking",
    "Automated Calculations",
    "Multi-tenant Support",
    "Payment History",
    "Usage Analytics",
    "Secure Data",
    "Easy Reconciliation",
    "Export Reports",
  ];

  const steps = [
    {
      number: "01",
      title: "Add Your Meters",
      description: "Set up your main meter and sub-meters for each unit or tenant in minutes.",
    },
    {
      number: "02",
      title: "Record Readings",
      description: "Enter periodic meter readings and let PowerTrackr calculate usage and costs.",
    },
    {
      number: "03",
      title: "Track Payments",
      description: "Record payments and automatically reconcile balances across all accounts.",
    },
  ];

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "50M+", label: "kWh Tracked" },
    { value: "99.9%", label: "Uptime" },
    { value: "4.9★", label: "User Rating" },
  ];
</script>

<div class="relative min-h-screen overflow-hidden bg-background">
  <!-- Animated background blobs -->
  <div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>
  </div>

  <!-- Floating particles -->
  <div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
    <div class="particle particle-1"></div>
    <div class="particle particle-2"></div>
    <div class="particle particle-3"></div>
    <div class="particle particle-4"></div>
    <div class="particle particle-5"></div>
  </div>

  <!-- Header -->
  <header
    class="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg supports-backdrop-filter:bg-background/60"
  >
    <div class="container mx-auto flex items-center justify-between px-4 py-4">
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
    </div>
  </header>

  <!-- Hero Section -->
  <section
    class="relative z-10 flex min-h-[calc(100vh-73px)] flex-col items-center justify-center px-4 py-20 text-center"
  >
    <div class="container mx-auto w-full max-w-4xl">
      <!-- Badge -->
      <div
        class="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
      >
        <Zap class="h-4 w-4" />
        <span>Smart Electricity Management</span>
      </div>

      <!-- Hero Title -->
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

      <!-- Features Grid -->
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
  </section>

  <!-- Marquee Benefits Section -->
  <section class="relative z-10 border-y border-border/50 bg-muted/30 py-8">
    <Marquee class="py-4" gap={48} duration={25} velocity={0.1}>
      {#each benefits as benefit}
        <div class="flex items-center gap-3 text-xl font-medium text-foreground/80">
          <CheckCircle class="h-5 w-5 text-primary" />
          <span>{benefit}</span>
        </div>
      {/each}
    </Marquee>
    <Marquee class="py-4" gap={48} duration={30} velocity={0.3} reversed>
      {#each benefits as benefit}
        <div class="flex items-center gap-3 text-xl font-medium text-foreground/80">
          <CheckCircle class="h-5 w-5 text-primary" />
          <span>{benefit}</span>
        </div>
      {/each}
    </Marquee>
  </section>

  <!-- How It Works Section -->
  <section class="relative z-10 py-24">
    <div class="container mx-auto px-4">
      <div class="mb-16 text-center">
        <SplitReveal mode="words" triggerOnScroll>
          <h2 class="text-3xl font-bold tracking-tight md:text-5xl">How It Works</h2>
        </SplitReveal>
        <SplitReveal mode="lines" triggerOnScroll delay={0.2}>
          <p class="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Get started in minutes with our simple three-step process
          </p>
        </SplitReveal>
      </div>

      <div class="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
        {#each steps as step, i}
          <div class="group relative">
            <div
              class="relative rounded-2xl border border-border/50 bg-background/50 p-8 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
            >
              <div
                class="mb-4 text-6xl font-bold text-primary/20 transition-colors group-hover:text-primary/40"
              >
                {step.number}
              </div>
              <h3 class="mb-2 text-xl font-semibold">
                <SplitReveal mode="chars" triggerOnScroll delay={0.1 * i}>
                  {step.title}
                </SplitReveal>
              </h3>
              <p class="text-muted-foreground">
                <SplitReveal mode="lines" triggerOnScroll delay={0.2 + 0.1 * i}>
                  {step.description}
                </SplitReveal>
              </p>
            </div>
            {#if i < steps.length - 1}
              <div
                class="absolute top-1/2 -right-4 hidden h-0.5 w-8 bg-linear-to-r from-primary/50 to-transparent md:block"
              ></div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Stats Section -->
  <section class="relative z-10 border-y border-border/50 bg-muted/30 py-20">
    <div class="container mx-auto px-4">
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {#each stats as stat, i}
          <div class="text-center">
            <div class="mb-2 text-4xl font-bold text-primary md:text-5xl">
              <SplitReveal mode="chars" triggerOnScroll delay={0.1 * i}>
                {stat.value}
              </SplitReveal>
            </div>
            <div class="text-muted-foreground">
              <SplitReveal mode="words" triggerOnScroll delay={0.2 + 0.1 * i}>
                {stat.label}
              </SplitReveal>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Why Choose Us Section -->
  <section class="relative z-10 py-24">
    <div class="container mx-auto px-4">
      <div class="mb-16 text-center">
        <SplitReveal mode="words" triggerOnScroll>
          <h2 class="text-3xl font-bold tracking-tight md:text-5xl">Why Choose PowerTrackr?</h2>
        </SplitReveal>
        <SplitReveal mode="lines" triggerOnScroll delay={0.2}>
          <p class="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Built for property managers who need reliable electricity billing
          </p>
        </SplitReveal>
      </div>

      <div class="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card
          class="group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
        >
          <CardHeader>
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20"
            >
              <ChartLine class="h-6 w-6 text-primary" />
            </div>
            <CardTitle class="text-lg">Analytics</CardTitle>
            <CardDescription>
              Track usage trends and costs with detailed charts and reports.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          class="group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
        >
          <CardHeader>
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20"
            >
              <Users class="h-6 w-6 text-primary" />
            </div>
            <CardTitle class="text-lg">Multi-Tenant</CardTitle>
            <CardDescription>
              Manage unlimited sub-meters and tenants from one dashboard.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          class="group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
        >
          <CardHeader>
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20"
            >
              <Shield class="h-6 w-6 text-primary" />
            </div>
            <CardTitle class="text-lg">Secure</CardTitle>
            <CardDescription>
              Your data is encrypted and backed up with enterprise-grade security.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          class="group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
        >
          <CardHeader>
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20"
            >
              <Clock class="h-6 w-6 text-primary" />
            </div>
            <CardTitle class="text-lg">Save Time</CardTitle>
            <CardDescription>
              Automate calculations and reduce billing time by up to 90%.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="relative z-10 py-24">
    <div class="container mx-auto px-4">
      <div
        class="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-primary/10 via-primary/5 to-transparent p-12 text-center backdrop-blur-sm md:p-16"
      >
        <div class="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/20 blur-3xl"></div>
        <div
          class="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
        ></div>

        <div class="relative">
          <SplitReveal mode="words" triggerOnScroll>
            <h2 class="text-3xl font-bold tracking-tight md:text-5xl">
              Ready to simplify your billing?
            </h2>
          </SplitReveal>
          <SplitReveal mode="lines" triggerOnScroll delay={0.2}>
            <p class="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Join thousands of property managers who trust PowerTrackr for their electricity
              billing needs. Start your free trial today.
            </p>
          </SplitReveal>

          <div class="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Magnetic>
              <Button
                size="lg"
                class="shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
                href="/auth?act=register"
              >
                Start Free Trial
              </Button>
            </Magnetic>
            <Magnetic>
              <Button size="lg" variant="outline" href="/auth?act=login">Contact Sales</Button>
            </Magnetic>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="relative z-10 border-t border-border/50 bg-muted/30 py-12">
    <div class="container mx-auto px-4">
      <div class="flex flex-col items-center justify-between gap-4 md:flex-row">
        <Logo variant="ghost" class="px-0 md:pl-0!" />
        <p class="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} PowerTrackr. All rights reserved.
        </p>
      </div>
    </div>
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
