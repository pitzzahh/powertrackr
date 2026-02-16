<script lang="ts">
  import { getTotalEnergyUsage, getTotalBillingInfoCount } from "$/api/billing-info.remote";
  import { getTotalUserCount } from "$/api/user.remote";
  import { getTotalPaymentsAmount } from "$/api/payment.remote";
  import { SplitReveal, ScrollStagger } from "$lib/motion-core";

  const [energyUsed, userCount, billingCount, paymentsAmount] = await Promise.all([
    getTotalEnergyUsage(),
    getTotalUserCount(),
    getTotalBillingInfoCount(),
    getTotalPaymentsAmount(),
  ]);

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
    }
    return `${count}+`;
  };

  const stats = [
    { value: formatCount(userCount), label: `Active ${userCount === 1 ? "User" : "Users"}` },
    { value: energyUsed.formatted, label: `${energyUsed.energyUnit} Tracked` },
    { value: formatCount(billingCount), label: "Bills Tracked" },
    { value: paymentsAmount.formatted, label: "Payments Managed" },
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
