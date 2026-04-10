<script lang="ts">
  import { Zap, ChartLine, Coins, Clock, Shield, Users } from "$lib/assets/icons";
  import { Marquee, ScrollReveal } from "$lib/motion-core";

  const topRowBenefits = [
    { icon: Zap, text: "Track energy usage in real-time" },
    { icon: ChartLine, text: "Monitor billing trends over time" },
    { icon: Coins, text: "Allocate costs fairly to tenants" },
    { icon: Clock, text: "Save hours on manual calculations" },
  ];

  const bottomRowBenefits = [
    { icon: Shield, text: "Secure data with 2FA protection" },
    { icon: Users, text: "Manage multiple sub-meters easily" },
    { icon: Zap, text: "Automate per-kWh charge calculations" },
    { icon: ChartLine, text: "Generate clear billing summaries" },
  ];
</script>

<ScrollReveal preset="fade" duration={0.8} as="section" class="relative z-10 py-10">
  <div class="container mx-auto px-4">
    <div
      class="mb-6 flex items-center gap-4 text-xs tracking-[0.3em] text-muted-foreground uppercase"
    >
      <span class="rounded-full border border-primary/30 px-3 py-1 text-primary">Benefits</span>
      <span>Always-on clarity</span>
      <div class="h-px flex-1 bg-linear-to-r from-primary/30 via-white/10 to-transparent"></div>
    </div>

    <div class="relative overflow-hidden rounded-3xl border border-border/60 bg-muted/30">
      <div
        class="pointer-events-none absolute inset-y-0 left-0 w-20 bg-linear-to-r from-muted/80 to-transparent"
      ></div>
      <div
        class="pointer-events-none absolute inset-y-0 right-0 w-20 bg-linear-to-l from-muted/80 to-transparent"
      ></div>

      <Marquee class="pt-5 pb-2" gap={56} duration={28}>
        {#each topRowBenefits as benefit (benefit.text)}
          <div
            class="flex items-center gap-3 rounded-full border border-border/60 bg-background/70 px-4 py-2 text-sm font-medium text-foreground/80"
          >
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <benefit.icon class="h-4 w-4 text-primary" />
            </div>
            <span>{benefit.text}</span>
          </div>
        {/each}
      </Marquee>
      <Marquee class="pt-2 pb-5" gap={56} duration={32} reversed>
        {#each bottomRowBenefits as benefit (benefit.text)}
          <div
            class="flex items-center gap-3 rounded-full border border-border/60 bg-background/70 px-4 py-2 text-sm font-medium text-foreground/80"
          >
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <benefit.icon class="h-4 w-4 text-primary" />
            </div>
            <span>{benefit.text}</span>
          </div>
        {/each}
      </Marquee>
    </div>
  </div>
</ScrollReveal>
