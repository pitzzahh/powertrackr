<script lang="ts">
  import { getTotalEnergyUsage, getTotalBillingInfoCount } from "$/api/billing-info.remote";
  import { getTotalUserCount } from "$/api/user.remote";
  import { getTotalPaymentsAmount } from "$/api/payment.remote";
  import { ScrollStagger } from "$lib/motion-core";
  import { NumberTicker } from "$lib/components/ui/number-ticker";
  import { formatNumber, formatEnergy } from "$/utils/format";

  const [energyUsed, userCount, billingCount, paymentsAmount] = await Promise.all([
    getTotalEnergyUsage(),
    getTotalUserCount(),
    getTotalBillingInfoCount(),
    getTotalPaymentsAmount(),
  ]);

  const formatUserCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
    }
    return `${count}+`;
  };

  const formatBillingCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
    }
    return `${count}+`;
  };

  const stats = [
    {
      value: userCount,
      format: formatUserCount,
      label: `Active ${userCount === 1 ? "User" : "Users"}`,
    },
    {
      value: energyUsed.total,
      format: (val: number) => formatEnergy(val),
      label: `${energyUsed.energyUnit} Tracked`,
    },
    {
      value: billingCount,
      format: formatBillingCount,
      label: "Bills Tracked",
    },
    {
      value: paymentsAmount.total,
      format: (val: number) => formatNumber(val),
      label: "Payments Managed",
    },
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
            <NumberTicker value={stat.value} format={stat.format} delay={0.3 + i * 0.1} />
          </div>
          <div class="text-muted-foreground">
            {stat.label}
          </div>
        </div>
      {/each}
    </ScrollStagger>
  </div>
</section>
