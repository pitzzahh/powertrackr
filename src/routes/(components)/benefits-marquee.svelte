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

<ScrollReveal
  preset="fade"
  duration={0.8}
  as="section"
  class="relative z-10 border-y border-border/50 bg-muted/30 py-6"
>
  <Marquee class="py-3" gap={64} duration={30}>
    {#each topRowBenefits as benefit}
      <div class="flex items-center gap-3 text-lg font-medium text-foreground/80">
        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <benefit.icon class="h-4 w-4 text-primary" />
        </div>
        <span>{benefit.text}</span>
      </div>
    {/each}
  </Marquee>
  <Marquee class="py-3" gap={64} duration={35} reversed>
    {#each bottomRowBenefits as benefit}
      <div class="flex items-center gap-3 text-lg font-medium text-foreground/80">
        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <benefit.icon class="h-4 w-4 text-primary" />
        </div>
        <span>{benefit.text}</span>
      </div>
    {/each}
  </Marquee>
</ScrollReveal>
