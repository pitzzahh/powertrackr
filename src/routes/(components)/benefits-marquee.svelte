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

<ScrollReveal preset="fade" duration={0.8} as="section" class="relative z-10 py-14">
  <div class="container mx-auto px-4">
    <div class="flex items-center gap-3 text-muted-foreground">
      <p class="font-mono text-[11px] font-medium tracking-[0.3em] uppercase">Benefits</p>
      <div
        class="h-px flex-1 bg-linear-to-r from-border/80 to-transparent"
        aria-hidden="true"
      ></div>
    </div>

    <div
      class="relative mt-8 overflow-hidden rounded-3xl border border-border/60 bg-card/40 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
    >
      <Marquee class="pt-5 pb-2" gap={56} duration={28}>
        {#each topRowBenefits as benefit (benefit.text)}
          <div
            class="flex items-center gap-2.5 rounded-full border border-border/60 bg-background/70 px-5 py-2.5 text-sm font-medium text-foreground/80"
          >
            <benefit.icon class="size-4 text-primary" />
            <span>{benefit.text}</span>
          </div>
        {/each}
      </Marquee>
      <Marquee class="pt-2 pb-5" gap={56} duration={32} reversed>
        {#each bottomRowBenefits as benefit (benefit.text)}
          <div
            class="flex items-center gap-2.5 rounded-full border border-border/60 bg-background/70 px-5 py-2.5 text-sm font-medium text-foreground/80"
          >
            <benefit.icon class="size-4 text-primary" />
            <span>{benefit.text}</span>
          </div>
        {/each}
      </Marquee>
    </div>
  </div>
</ScrollReveal>
