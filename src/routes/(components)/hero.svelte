<script module lang="ts">
  interface HeroProps {
    user: App.Locals["user"];
    session: App.Locals["session"];
  }
  type HeroState = {
    texts: ("Billing" | "Payments" | "Usage" | "Expenses")[];
    currentIndex: number;
  };
</script>

<script lang="ts">
  import { Button } from "$/components/ui/button";
  import { Card, CardDescription, CardHeader } from "$/components/ui/card";
  import { Zap, PhilippinePeso, Banknote } from "$lib/assets/icons";
  import { TextLoop, Magnetic } from "$lib/motion-core";

  let { user, session }: HeroProps = $props();

  let { texts, currentIndex } = $state<HeroState>({
    texts: ["Billing", "Payments", "Usage", "Expenses"],
    currentIndex: 0,
  });

  const { fullyAuthenticated, needs2FA, currentText } = $derived({
    fullyAuthenticated:
      user &&
      session &&
      (user.isOauthUser || user.emailVerified) &&
      (!user.registeredTwoFactor || session.twoFactorVerified),
    needs2FA: user && user.registeredTwoFactor && (!session || !session.twoFactorVerified),
    currentText: texts[currentIndex],
  });
</script>

<section class="relative z-10 h-fit overflow-hidden">
  <div class="container mx-auto px-4 py-20 lg:py-28">
    <div class="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div class="relative">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs tracking-[0.3em] text-primary uppercase"
        >
          <Zap class="h-4 w-4" />
          <span>Electricity Billing Made Simple</span>
        </div>

        <h1 class="mt-6 text-4xl font-semibold tracking-tight md:text-6xl lg:text-7xl">
          <span class="text-muted-foreground">
            {currentText === "Payments" ? "Generate" : "Track"}
          </span>
          <span class="inline-flex align-baseline text-primary">
            <TextLoop {texts} bind:currentIndex interval={2500} />
          </span>
          <span>with clarity</span>
        </h1>

        <p class="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Record, organize, and reconcile electricity usage and payments across your account and
          sub-meters. Built for landlords, property managers, and multi-unit properties who need
          practical billing and expense allocation.
        </p>

        <div class="mt-8 flex flex-col gap-4 sm:flex-row">
          {#if fullyAuthenticated}
            <Button
              size="lg"
              class="shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
              href="/dashboard"
            >
              Go to Dashboard
            </Button>
          {:else if needs2FA}
            <Button
              size="lg"
              class="shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
              href="/auth?act=2fa-checkpoint"
            >
              Verify Two-Factor Authentication
            </Button>
          {:else}
            <Button
              size="lg"
              class="shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
              href="/auth?act=register"
            >
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" href="/auth?act=login">Sign In</Button>
          {/if}
        </div>

        <div class="mt-8 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span class="rounded-full border border-border/60 px-3 py-1">Multi-tenant</span>
          <span class="rounded-full border border-border/60 px-3 py-1">Sub-metering</span>
          <span class="rounded-full border border-border/60 px-3 py-1">2FA-ready</span>
        </div>
      </div>

      <div class="relative">
        <div class="absolute -inset-6 rounded-[2.5rem] bg-primary/10 blur-2xl"></div>
        <div class="relative grid gap-4">
          <Magnetic>
            <Card
              class="group relative overflow-hidden border-border/50 bg-background/60 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
            >
              <CardHeader class="relative flex items-start gap-4">
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20"
                >
                  <Zap class="h-6 w-6 text-primary" />
                </div>
                <div class="space-y-1">
                  <h2 class="text-base font-semibold">Billing Records</h2>
                  <CardDescription class="text-sm">
                    Record periodic billing entries with total kWh and balances per billing cycle.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Magnetic>

          <Magnetic>
            <Card
              class="group relative overflow-hidden border-border/50 bg-background/60 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 lg:translate-x-6"
            >
              <CardHeader class="relative flex items-start gap-4">
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20"
                >
                  <PhilippinePeso class="h-6 w-6 text-primary" />
                </div>
                <div class="space-y-1">
                  <h2 class="text-base font-semibold">Sub-Meter Tracking</h2>
                  <CardDescription class="text-sm">
                    Support multiple sub-meters per billing period to track each unit's usage
                    separately.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Magnetic>

          <Magnetic>
            <Card
              class="group relative overflow-hidden border-border/50 bg-background/60 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 lg:translate-x-12"
            >
              <CardHeader class="relative flex items-start gap-4">
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20"
                >
                  <Banknote class="h-6 w-6 text-primary" />
                </div>
                <div class="space-y-1">
                  <h2 class="text-base font-semibold">Payment Reconciliation</h2>
                  <CardDescription class="text-sm">
                    Associate payments with billing and sub-meter records for clear reconciliation.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Magnetic>
        </div>
      </div>
    </div>
  </div>
</section>
