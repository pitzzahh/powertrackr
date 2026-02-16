<script lang="ts">
  import { getTotalEnergyUsage } from "$/api/billing-info.remote";
  import { SplitReveal, ScrollStagger } from "$lib/motion-core";

  const energyUsed = await getTotalEnergyUsage();

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: energyUsed.formatted, label: `${energyUsed.energyUnit} Tracked` },
    { value: "99.9%", label: "Uptime" },
    { value: "4.9★", label: "User Rating" },
  ];
</script>

<section class="relative z-10 border-y border-border/50 bg-muted/30 py-20">
  <div class="container mx-auto px-4">
    <ScrollStagger
      preset="slide-up"
      stagger={0.1}
      duration={0.6}
      distance={30}
      class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
    >
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
    </ScrollStagger>
  </div>
</section>
