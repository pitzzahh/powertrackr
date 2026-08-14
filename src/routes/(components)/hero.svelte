<script module lang="ts">
  type HeroState = {
    texts: ("Billing" | "Payments" | "Usage" | "Expenses")[];
    currentIndex: number;
  };
</script>

<script lang="ts">
  import { Button } from "#lib/components/ui/button/index.js";
  import { NumberTicker } from "#lib/components/number-ticker/index.js";
  import { Zap } from "#lib/assets/icons.js";
  import { TextLoop } from "#lib/motion-core/index.js";
  import { getStats } from "#lib/api/stats.remote.js";
  import { getCurrentUser } from "#lib/api/user.remote.js";
  import { ButtonSkeleton } from "#lib/components/snippets.svelte";
  import { browser } from "$app/env";
  import { convertEnergy, getEnergyUnit } from "#lib/utils/converter/energy.js";
  import {
    Arc,
    Chart,
    Circle,
    ClipPath,
    Group,
    Layer,
    Line,
    LinearGradient,
    Text,
  } from "layerchart";
  import { scaleLinear } from "d3-scale";
  import type { Stats } from "#lib/types/stats.js";

  const authQuery = browser ? getCurrentUser() : null;
  const { user, session } = $derived(authQuery?.current ?? { user: null, session: null });

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

  const statsQuery = browser ? getStats() : null;
  const stats = $derived(statsQuery?.current ?? FALLBACK_STATS);

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
  const gaugeRadius = { outerRadius: 84, innerRadius: 66 };

  const angleScale = scaleLinear().domain(domain).range(angleRange);

  const gaugeTicks = [0, 25, 50, 75, 100];
  const gaugeMinorTicks = Array.from({ length: 11 }, (_, i) => i * 10).filter(
    (tick) => tick % 25 !== 0
  );

  // Decorative resting position — set once, never mutated. The real figures
  // come from the readout inside the gauge, not from this dial.
  let dial = $state(62);

  const needleAngle = $derived((angleScale(dial) * Math.PI) / 180);
  const formattedEnergy = $derived(
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(energyValue)
  );
</script>

<section class="relative z-10 overflow-hidden">
  <!-- Blueprint grid backdrop -->
  <div
    class="pointer-events-none absolute inset-x-0 top-8 bottom-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--color-border)_45%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--color-border)_45%,transparent)_1px,transparent_1px)] mask-[radial-gradient(ellipse_75%_65%_at_50%_0%,black,transparent)] bg-size-[48px_48px]"
    aria-hidden="true"
  ></div>
  <!-- Top glow -->
  <div
    class="pointer-events-none absolute -top-40 left-1/2 h-136 w-216 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
    aria-hidden="true"
  ></div>

  <div class="relative container mx-auto px-4 py-20 lg:py-28">
    <div class="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div class="relative">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 font-mono text-[11px] tracking-[0.2em] text-primary uppercase"
        >
          <Zap class="size-3.5" />

          <span>
            Electricity billing
            <span class="hidden sm:inline">, without the spreadsheet</span>
          </span>
        </div>

        <h1 class="mt-6 text-4xl font-semibold tracking-tight md:text-6xl lg:text-7xl">
          <span class="text-muted-foreground"
            >{currentText === "Payments" ? "Record" : "Track"}</span
          >

          <span class="inline-flex align-baseline text-primary">
            <TextLoop {texts} bind:currentIndex interval={2500} />
            .
          </span>
          <span class="block">No guesswork.</span>
        </h1>

        <p class="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Record, organize, and reconcile electricity usage and payments across your account and
          sub-meters. Built for landlords, property managers, and multi-unit properties who need
          practical billing and expense allocation.
        </p>

        <div class="mt-8 flex flex-col gap-4 sm:flex-row">
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
              size="lg"
              class="shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
              href="/auth?act=2fa-checkpoint"
            >
              Verify Two-Factor Authentication
            </Button>
          {:else if authQuery?.loading}
            {@render ButtonSkeleton({ size: "lg" })}
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

          <div class="h-52.5 px-5 pt-5">
            {#if browser}
              <Chart height={190} padding={20} class="mx-auto w-full max-w-[16rem]">
                <Layer center>
                  <Group y={22}>
                    <LinearGradient class="from-primary/30 via-primary/70 to-primary">
                      {#snippet children({ gradient })}
                        <ClipPath>
                          {#snippet clip()}
                            <Arc
                              value={dial}
                              {domain}
                              range={angleRange}
                              {...gaugeRadius}
                              cornerRadius={8}
                            />
                          {/snippet}
                          <Arc
                            value={domain[1]}
                            {domain}
                            range={angleRange}
                            {...gaugeRadius}
                            cornerRadius={8}
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
                      cornerRadius={8}
                      class="fill-none"
                      track={{ class: "fill-none stroke-foreground/15" }}
                    />

                    <!-- Minor tick marks -->
                    {#each gaugeMinorTicks as tick (tick)}
                      {@const angleDeg = angleScale(tick)}
                      {@const angleRad = (angleDeg * Math.PI) / 180}
                      {@const tickInner = 66 - 7}
                      {@const tickOuter = 66 - 2}
                      <Line
                        x1={Math.sin(angleRad) * tickInner}
                        y1={-Math.cos(angleRad) * tickInner}
                        x2={Math.sin(angleRad) * tickOuter}
                        y2={-Math.cos(angleRad) * tickOuter}
                        class="stroke-foreground/20"
                        strokeWidth={1}
                      />
                    {/each}

                    <!-- Major tick marks -->
                    {#each gaugeTicks as tick (tick)}
                      {@const angleDeg = angleScale(tick)}
                      {@const angleRad = (angleDeg * Math.PI) / 180}
                      {@const tickInner = 66 - 10}
                      {@const tickOuter = 66 - 3}
                      <Line
                        x1={Math.sin(angleRad) * tickInner}
                        y1={-Math.cos(angleRad) * tickInner}
                        x2={Math.sin(angleRad) * tickOuter}
                        y2={-Math.cos(angleRad) * tickOuter}
                        class={tick === 50 ? "stroke-foreground/60" : "stroke-foreground/25"}
                        strokeWidth={tick === 50 ? 2 : 1.2}
                      />
                    {/each}

                    <!-- Needle -->
                    <Line
                      x1={Math.sin(needleAngle) * -8}
                      y1={-Math.cos(needleAngle) * -8}
                      x2={Math.sin(needleAngle) * 52}
                      y2={-Math.cos(needleAngle) * 52}
                      class="stroke-foreground"
                      stroke-width={2.5}
                      stroke-linecap="round"
                    />
                    <Circle r={5} class="fill-primary" />
                    <Circle r={1.8} class="fill-background" />

                    <!-- Value readout -->
                    <Text
                      value={formattedEnergy}
                      textAnchor="middle"
                      verticalAnchor="middle"
                      dy={24}
                      class="fill-foreground text-3xl font-bold tabular-nums"
                    />
                    <Text
                      x={0}
                      y={44}
                      value={energyUnit}
                      textAnchor="middle"
                      verticalAnchor="middle"
                      class="fill-muted-foreground font-mono text-[10px] uppercase"
                    />
                  </Group>
                </Layer>
              </Chart>
            {/if}
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
    </div>
  </div>
</section>
