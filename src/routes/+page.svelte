<script lang="ts">
  import { goto } from "$app/navigation";
  import Logo from "$/components/logo.svelte";
  import { Button } from "$/components/ui/button";
  import { Card, CardDescription, CardHeader, CardTitle } from "$/components/ui/card";
  import { Zap, PhilippinePeso, Banknote } from "$lib/assets/icons";
</script>

<div
  class="relative flex min-h-screen flex-col overflow-hidden bg-linear-to-br from-background via-background to-muted"
>
  <!-- Animated background elements -->
  <div class="pointer-events-none absolute inset-0 overflow-hidden">
    <div class="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl"></div>
    <div class="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
    <div class="absolute right-1/4 -bottom-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl"></div>
  </div>

  <!-- Floating decorative elements -->
  <div class="pointer-events-none absolute inset-0 overflow-hidden">
    <div class="animate-float absolute top-20 left-[10%] h-2 w-2 rounded-full bg-primary/40"></div>
    <div
      class="animate-float-delayed absolute top-40 right-[15%] h-3 w-3 rounded-full bg-primary/30"
    ></div>
    <div
      class="animate-float absolute bottom-40 left-[20%] h-2 w-2 rounded-full bg-primary/50"
    ></div>
    <div
      class="animate-float-delayed absolute top-1/3 right-[25%] h-1.5 w-1.5 rounded-full bg-primary/40"
    ></div>
  </div>

  <!-- Header -->
  <header class="relative z-10 container mx-auto flex items-center justify-between px-4 py-6">
    <Logo
      variant="ghost"
      class="mx-auto w-1/2 px-0 md:m-0 md:w-fit md:pl-0!"
      viewTransitionName="logo"
    />

    <div class="flex gap-2">
      <Button variant="outline" class="backdrop-blur-sm" onclick={() => goto("/auth?act=login")}
        >Login</Button
      >
      <Button
        class="shadow-lg shadow-primary/25 transition-shadow hover:shadow-xl hover:shadow-primary/30"
        onclick={() => goto("/auth?act=register")}>Sign Up</Button
      >
    </div>
  </header>

  <!-- Hero Section -->
  <main
    class="relative z-10 container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-12 text-center"
  >
    <div class="animate-fade-in-up max-w-4xl space-y-8">
      <div class="space-y-4">
        <!-- Badge -->
        <div
          class="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm"
        >
          <Zap class="h-4 w-4" />
          <span>Smart Electricity Management</span>
        </div>

        <h1 class="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
          Manage <span
            class="bg-linear-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent"
            >Electricity</span
          >
          Billing
          <span class="block text-3xl font-normal text-muted-foreground md:text-4xl lg:text-5xl"
            >with ease and precision</span
          >
        </h1>
        <p class="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
          Record, organize, and reconcile electricity usage and payments across your account and
          sub-meters. Perfect for landlords, property managers, and multi-unit properties.
        </p>
      </div>

      <div class="flex flex-col justify-center gap-4 sm:flex-row">
        <Button
          size="lg"
          class="group relative overflow-hidden shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
          onclick={() => goto("/auth?act=register")}
        >
          <span class="relative z-10">Get Started Free</span>
          <div
            class="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full"
          ></div>
        </Button>
        <Button
          size="lg"
          variant="outline"
          class="backdrop-blur-sm transition-all hover:bg-background/80"
          onclick={() => goto("/auth?act=login")}
        >
          Sign In
        </Button>
      </div>

      <!-- Features -->
      <div class="animate-fade-in-up-delayed mt-16 grid gap-6 md:grid-cols-3">
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
  @keyframes float {
    0%,
    100% {
      transform: translateY(0) scale(1);
      opacity: 0.4;
    }
    50% {
      transform: translateY(-20px) scale(1.1);
      opacity: 0.6;
    }
  }

  @keyframes float-delayed {
    0%,
    100% {
      transform: translateY(0) scale(1);
      opacity: 0.3;
    }
    50% {
      transform: translateY(-15px) scale(1.05);
      opacity: 0.5;
    }
  }

  :global(.animate-float) {
    animation: float 6s ease-in-out infinite;
  }

  :global(.animate-float-delayed) {
    animation: float-delayed 8s ease-in-out infinite;
    animation-delay: 2s;
  }

  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(2rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  :global(.animate-fade-in-up) {
    animation: fade-in-up 0.7s ease-out forwards;
  }

  :global(.animate-fade-in-up-delayed) {
    animation: fade-in-up 0.7s ease-out 0.3s forwards;
    opacity: 0;
  }
</style>
