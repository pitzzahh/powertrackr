<script module lang="ts">
  interface HeroProps {
    user: App.Locals["user"];
    session: App.Locals["session"];
  }
</script>

<script lang="ts">
  import { Button } from "$/components/ui/button";
  import { Card, CardDescription, CardHeader, CardTitle } from "$/components/ui/card";
  import { Zap, PhilippinePeso, Banknote } from "$lib/assets/icons";
  import { TextLoop, Magnetic, ScrollReveal, ScrollStagger } from "$lib/motion-core";

  let { user, session }: HeroProps = $props();

  const { fullyAuthenticated, needs2FA } = $derived({
    fullyAuthenticated:
      user &&
      session &&
      (user.isOauthUser || user.emailVerified) &&
      (!user.registeredTwoFactor || session.twoFactorVerified),
    needs2FA: user && user.registeredTwoFactor && (!session || !session.twoFactorVerified),
  });
</script>

<section
  class="relative z-10 flex min-h-[calc(100vh-73px)] flex-col items-center justify-center px-4 py-20 text-center"
>
  <div class="container mx-auto w-full max-w-4xl">
    <!-- Badge - above fold, play once -->
    <ScrollReveal preset="slide-down" duration={0.6} delay={0.1}>
      <div class="group relative mx-auto mb-6 inline-flex">
        <!-- Animated glow border -->
        <div
          class="absolute -inset-0.5 animate-pulse rounded-full bg-linear-to-r from-primary/50 via-primary to-primary/50 opacity-50 blur-sm transition-opacity group-hover:opacity-75"
        ></div>
        <div
          class="relative inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background px-4 py-1.5 text-sm font-medium text-primary"
        >
          <Zap class="h-4 w-4 animate-pulse" />
          <span>Electricity Billing Made Simple</span>
        </div>
      </div>
    </ScrollReveal>

    <!-- Hero Title - above fold, play once -->
    <ScrollReveal preset="fade" duration={0.8} delay={0.2}>
      <div class="flex min-h-25 flex-col items-center justify-center md:min-h-55 lg:min-h-52">
        <h1 class="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
          Track{" "}
          <span class="inline-flex justify-center align-baseline">
            <TextLoop
              class="text-primary"
              texts={["Billing", "Payments", "Usage", "Expenses"]}
              interval={2500}
            />
          </span>{" "}
          Easily
        </h1>
        <p class="mt-2 text-3xl font-normal text-muted-foreground md:text-4xl lg:text-5xl">
          for multi-tenant properties
        </p>
      </div>
    </ScrollReveal>

    <!-- Description - above fold, play once -->
    <ScrollReveal preset="slide-up" duration={0.7} delay={0.4}>
      <p
        class="mx-auto my-6 mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
      >
        Record, organize, and reconcile electricity usage and payments across your account and
        sub-meters. Built for landlords, property managers, and multi-unit properties who need
        practical billing and expense allocation.
      </p>
    </ScrollReveal>

    <!-- Buttons - above fold, play once, no Magnetic -->
    <ScrollReveal preset="slide-up" duration={0.6} delay={0.5}>
      <div class="flex flex-col justify-center gap-4 sm:flex-row">
        {#if fullyAuthenticated}
          <Button
            data-sveltekit-reload
            size="lg"
            class="shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
            href="/dashboard"
          >
            Go to Dashboard
          </Button>
        {:else if needs2FA}
          <Button
            data-sveltekit-reload
            size="lg"
            class="shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
            href="/auth?act=2fa-checkpoint"
          >
            Verify Two-Factor Authentication
          </Button>
        {:else}
          <Button
            data-sveltekit-reload
            size="lg"
            class="shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
            href="/auth?act=register"
          >
            Get Started Free
          </Button>
          <Button data-sveltekit-reload size="lg" variant="outline" href="/auth?act=login"
            >Sign In</Button
          >
        {/if}
      </div>
    </ScrollReveal>

    <!-- Features Grid - can be below fold on smaller screens, allow reverse -->
    <ScrollStagger
      preset="slide-up"
      stagger={0.15}
      duration={0.6}
      delay={0.6}
      distance={30}
      class="mt-16 grid gap-6 md:grid-cols-3"
    >
      <Magnetic>
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
      </Magnetic>

      <Magnetic>
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
      </Magnetic>

      <Magnetic>
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
      </Magnetic>
    </ScrollStagger>
  </div>
</section>
