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
  import { NumberTicker } from "$lib/components/number-ticker";
  import { Zap } from "$lib/assets/icons";
  import { TextLoop, ScrollReveal } from "$lib/motion-core";
  import { getStats } from "$/api/stats.remote";
  import { convertEnergy, getEnergyUnit } from "$/utils/converter/energy";
  import { Arc, Chart, ClipPath, Group, Layer, Line, LinearGradient } from "layerchart";
  import { scaleLinear } from "d3-scale";
  import type { Stats } from "$/types/stats";

  let { user, session }: HeroProps = $props();

  let { texts, currentIndex } = $state<HeroState>({
    texts: ["Billing", "Payments", "Usage", "Expenses"],
    currentIndex: 0,
  });

  const FALLBACK_STATS: Stats = {
    userCount: 0,
    energyUsed: { total: 0, energyUnit: "kWh", formatted: "" },
    billingCount: 0,
    paymentsAmount: { total: 0, formatted: "" },
  };

  const statsQuery = getStats();
  const stats = $derived(statsQuery.current ?? FALLBACK_STATS);

  const { fullyAuthenticated, needs2FA, currentText, energyValue, energyUnit } = $derived({
    fullyAuthenticated:
      user &&
      session &&
      (user.isOauthUser || user.emailVerified) &&
      (!user.registeredTwoFactor || session.twoFactorVerified),
    needs2FA: user && user.registeredTwoFactor && (!session || !session.twoFactorVerified),
    currentText: texts[currentIndex],
    energyValue: convertEnergy(stats.energyUsed.total, stats.energyUsed.energyUnit),
    energyUnit: getEnergyUnit(stats.energyUsed.total),
  });

  // ─── Ambient gauge ────────────────────────────────────────────────────────
  const domain: [number, number] = [0, 100];
  const angleRange: [number, number] = [-120, 120];
  const gaugeRadius = { outerRadius: 80, innerRadius: 68 };

  const angleScale = scaleLinear().domain(domain).range(angleRange);

  const gaugeTicks = [0, 25, 50, 75, 100];

  // Decorative resting position — set once, never mutated. The real figures
  // come from the live readout below, not from this dial.
  let dial = $state(62);
</script>

<section class="relative z-10 overflow-hidden">
  <!-- Blueprint grid backdrop -->
  <div
    class="pointer-events-none absolute inset-x-0 top-8 bottom-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--color-border)_45%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--color-border)_45%,transparent)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_0%,black,transparent)] bg-[size:48px_48px]"
    aria-hidden="true"
  ></div>
  <!-- Top glow -->
  <div
    class="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[54rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
    aria-hidden="true"
  ></div>

  <div class="relative container mx-auto px-4 py-20 lg:py-28">
    <div class="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div class="relative">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 font-mono text-[11px] tracking-[0.2em] text-primary uppercase"
        >
          <Zap class="size-3.5" />
          <span>Electricity billing, without the spreadsheet</span>
        </div>

        <h1 class="mt-6 text-4xl font-semibold tracking-tight md:text-6xl lg:text-7xl">
          <span class="text-muted-foreground">
            {currentText === "Payments" ? "Record" : "Track"}
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

      <!-- Live meter -->
      <ScrollReveal preset="slide-up" duration={0.7} delay={0.2} distance={32}>
        <div class="relative mx-auto w-full max-w-md">
          <div
            class="absolute -inset-6 rounded-[2.5rem] bg-primary/10 blur-3xl"
            aria-hidden="true"
          ></div>
          <div
            class="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 backdrop-blur"
          >
            <div class="flex items-center justify-between border-b border-border/70 px-5 py-3.5">
              <span
                class="flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase"
              >
                <span class="size-1.5 animate-pulse rounded-full bg-primary"></span>
                Live readout
              </span>
              <span class="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
                PowerTrackr
              </span>
            </div>

            <div class="px-5 pt-5">
              <Chart height={168} padding={20} class="mx-auto w-full max-w-[15rem]">
                <Layer center>
                  <Group y={20}>
                    <LinearGradient class="from-primary/30 via-primary/70 to-primary">
                      {#snippet children({ gradient })}
                        <ClipPath>
                          {#snippet clip()}
                            <Arc
                              value={dial}
                              {domain}
                              range={angleRange}
                              {...gaugeRadius}
                              cornerRadius={6}
                              motion="spring"
                            />
                          {/snippet}
                          <Arc
                            value={domain[1]}
                            {domain}
                            range={angleRange}
                            {...gaugeRadius}
                            cornerRadius={6}
                            fill={gradient}
                          />
                        </ClipPath>
                      {/snippet}
                    </LinearGradient>

                    <!-- Track outline -->
                    <Arc
                      value={domain[1]}
                      {domain}
                      range={angleRange}
                      {...gaugeRadius}
                      cornerRadius={6}
                      class="fill-none"
                      track={{ class: "fill-none stroke-foreground/15" }}
                    />

                    <!-- Major tick marks -->
                    {#each gaugeTicks as tick (tick)}
                      {@const angleDeg = angleScale(tick)}
                      {@const angleRad = (angleDeg * Math.PI) / 180}
                      {@const tickInner = 68 - 10}
                      {@const tickOuter = 68 - 3}
                      <Line
                        x1={Math.sin(angleRad) * tickInner}
                        y1={-Math.cos(angleRad) * tickInner}
                        x2={Math.sin(angleRad) * tickOuter}
                        y2={-Math.cos(angleRad) * tickOuter}
                        class={tick === 50 ? "stroke-foreground/60" : "stroke-foreground/25"}
                        strokeWidth={tick === 50 ? 2 : 1.2}
                      />
                    {/each}
                  </Group>
                </Layer>
              </Chart>

              <div class="mt-2 text-center">
                <p class="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
                  Total energy tracked
                </p>
                <p class="mt-2 text-4xl font-semibold text-primary tabular-nums">
                  <NumberTicker
                    value={energyValue}
                    format={{
                      style: "decimal",
                      maximumFractionDigits: 2,
                      trailingZeroDisplay: "stripIfInteger",
                    }}
                    suffix={energyUnit}
                    class="text-primary [&::part(suffix)]:ml-2"
                  />
                </p>
              </div>
            </div>

            <div class="mt-6 grid grid-cols-2 divide-x divide-border/70 border-t border-border/70">
              <div class="px-5 py-4">
                <p class="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                  Bills tracked
                </p>
                <p class="mt-1 text-lg font-semibold tabular-nums">
                  <NumberTicker
                    value={stats.billingCount}
                    format={{
                      style: "decimal",
                      notation: "compact",
                      trailingZeroDisplay: "stripIfInteger",
                    }}
                    suffix="+"
                    class="text-foreground [&::part(suffix)]:ml-1"
                  />
                </p>
              </div>
              <div class="px-5 py-4">
                <p class="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                  Payments managed
                </p>
                <p class="mt-1 text-lg font-semibold tabular-nums">
                  <NumberTicker
                    value={stats.paymentsAmount.total}
                    format={{
                      style: "currency",
                      currency: "PHP",
                      notation: "compact",
                      trailingZeroDisplay: "stripIfInteger",
                    }}
                    suffix="+"
                    class="text-foreground [&::part(suffix)]:ml-1"
                  />
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  </div>
</section>
