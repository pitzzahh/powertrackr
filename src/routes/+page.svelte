<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { showSuccess } from "$/components/toast";
  import { formatNumber } from "$/utils/format";
  import { ChartArea, ChartBar, toAreaChartData, toBarChartData } from "$routes/(components)";
  import { scale } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import { billingStore } from "$lib/stores/billing.svelte.js";
  import { Loader, Banknote } from "$lib/assets/icons";

  let { data } = $props();

  onMount(() => {
    billingStore.setUserId(data.user.id);
    billingStore.fetchData();
    if (page.url.searchParams.get("oauth") === "github" && data.user) {
      showSuccess("Logged in successfully");
      goto("/", { replaceState: true });
    }
  });
</script>

{@render Metrics()}

<section in:scale={{ duration: 350, easing: cubicInOut, start: 0.8 }}>
  <ChartArea
    status={billingStore.status}
    refetch={billingStore.refresh}
    chartData={billingStore.extendedBillingInfos.map(toAreaChartData)}
  />
</section>

<section in:scale={{ duration: 450, easing: cubicInOut, start: 0.8 }}>
  <ChartBar
    status={billingStore.status}
    refetch={billingStore.refresh}
    chartData={billingStore.extendedBillingInfos.map(toBarChartData)}
  />
</section>

{#snippet Metrics()}
  <section
    in:scale={{ duration: 250, easing: cubicInOut, start: 0.8 }}
    class="flex flex-col justify-between gap-8 rounded-md border bg-card p-6 text-muted-foreground shadow-sm xl:flex-row xl:items-center"
  >
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <Banknote class="h-5 w-5" />
        <span class="text-lg">Current</span>
      </div>
      {#if billingStore.status === "fetching"}
        <Loader class="h-5 w-5 animate-spin" />
      {:else if billingStore.status === "error"}
        <div class="text-5xl font-bold md:text-4xl lg:text-5xl">0</div>
      {:else}
        <div class="text-5xl font-bold md:text-4xl lg:text-5xl">
          {formatNumber(billingStore.summary?.current || 0)}
        </div>
      {/if}
    </div>

    <div class="grid grid-cols-2 gap-8 md:grid-cols-4 xl:gap-16">
      <div class="flex flex-col gap-1">
        <span class="text-sm">Total Cost</span>
        {#if billingStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if billingStore.status === "error"}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl">0</span>
        {:else}
          <span class="text-2xl font-semibold md:text-xl lg:text-2xl"
            >{formatNumber(billingStore.summary?.invested || 0)}</span
          >
        {/if}
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">Total Savings</span>
        {#if billingStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if billingStore.status === "error"}
          <span class="text-2xl font-semibold text-green-600 md:text-xl lg:text-2xl">+0</span>
        {:else}
          <span class="text-2xl font-semibold text-green-600 md:text-xl lg:text-2xl"
            >+{formatNumber(billingStore.summary?.totalReturns || 0)}</span
          >
        {/if}
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">Net Savings</span>
        {#if billingStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if billingStore.status === "error"}
          <span class="text-2xl font-semibold text-green-600 md:text-xl lg:text-2xl">+0%</span>
        {:else}
          <span class="text-2xl font-semibold text-green-600 md:text-xl lg:text-2xl"
            >+{formatNumber(billingStore.summary?.netReturns || 0)}%</span
          >
        {/if}
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">1 Day Savings</span>
        {#if billingStore.status === "fetching"}
          <Loader class="h-4 w-4 animate-spin" />
        {:else if billingStore.status === "error"}
          <span class="text-2xl font-semibold text-green-600 md:text-xl lg:text-2xl">+0</span>
        {:else}
          <span class="text-2xl font-semibold text-green-600 md:text-xl lg:text-2xl"
            >+{formatNumber(billingStore.summary?.oneDayReturns || 0)}</span
          >
        {/if}
      </div>
    </div>
  </section>
{/snippet}
