<script module lang="ts">
  function formatUserCount(count: number) {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
    }
    return `${count}+`;
  }
  function formatBillingCount(count: number) {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
    }
    return `${count}+`;
  }
</script>

<script lang="ts">
  import { getTotalEnergyUsage, getTotalBillingInfoCount } from "$/api/billing-info.remote";
  import { getTotalUserCount } from "$/api/user.remote";
  import { getTotalPaymentsAmount } from "$/api/payment.remote";
  import { ScrollStagger } from "$lib/motion-core";
  import { NumberTicker } from "$lib/components/ui/number-ticker";
  import { formatNumber, formatEnergy } from "$/utils/format";
  import { onMount } from "svelte";
  import type { RemoteQuery } from "@sveltejs/kit";
  import type { TotalEnergyUsageResult } from "$/server/crud/billing-info-crud";
  import type { TotalPaymentsAmountResult } from "$/server/crud/payment-crud";

  let { userCountResult, energyUsedResult, billingCountResult, paymentsAmountResult } = $state<{
    userCountResult: RemoteQuery<number>;
    energyUsedResult: RemoteQuery<TotalEnergyUsageResult>;
    billingCountResult: RemoteQuery<number>;
    paymentsAmountResult: RemoteQuery<TotalPaymentsAmountResult>;
  }>({
    userCountResult: null!,
    energyUsedResult: null!,
    billingCountResult: null!,
    paymentsAmountResult: null!,
  });

  const { userCount, energyUsed, billingCount, paymentsAmount } = $derived({
    userCount: userCountResult?.current || 0,
    energyUsed: energyUsedResult?.current || {
      total: 0,
      energyUnit: "kWh",
      formatted: "0 kWh",
    },
    billingCount: billingCountResult?.current || 0,
    paymentsAmount: paymentsAmountResult?.current || { total: 0, formatted: formatNumber(0) },
  });

  const stats = $derived([
    {
      ready: userCountResult?.ready || false,
      value: userCount,
      format: formatUserCount,
      label: `Active ${userCount === 1 ? "User" : "Users"}`,
    },
    {
      ready: energyUsedResult?.ready || false,
      value: energyUsed.total,
      format: (val: number) => formatEnergy(val),
      label: `${energyUsed.energyUnit} Tracked`,
    },
    {
      ready: billingCountResult?.ready || false,
      value: billingCount,
      format: formatBillingCount,
      label: "Bills Tracked",
    },
    {
      ready: paymentsAmountResult?.ready || false,
      value: paymentsAmount.total,
      format: (val: number) => formatNumber(val),
      label: "Payments Managed",
    },
  ]);

  onMount(() => {
    let timeout: string | number | NodeJS.Timeout | undefined;
    try {
      userCountResult = getTotalUserCount();
      energyUsedResult = getTotalEnergyUsage();
      billingCountResult = getTotalBillingInfoCount();
      paymentsAmountResult = getTotalPaymentsAmount();
    } catch {
      console.warn("DB Fetch failed, retrying");
      try {
        timeout = setTimeout(() => {
          userCountResult?.refresh();
          energyUsedResult?.refresh();
          billingCountResult?.refresh();
          paymentsAmountResult?.refresh();
        }, 5000);
      } catch {
        console.warn("Retry failed, using defaults");
      }
      return clearTimeout(timeout);
    }
  });
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
      {#each stats as stat, i (stat.label)}
        <div class="text-center">
          <div class="mb-2 text-4xl font-bold text-primary md:text-5xl">
            {#key stat.ready}
              <NumberTicker value={stat.value} format={stat.format} delay={0.3 + i * 0.1} />
            {/key}
          </div>
          <div class="text-muted-foreground">
            {stat.label}
          </div>
        </div>
      {/each}
    </ScrollStagger>
  </div>
</section>
