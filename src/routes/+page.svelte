<script lang="ts">
  import { Wallet } from "@lucide/svelte";
  import Header from "./(components)/header.svelte";
  import Sidebar from "./(components)/sidebar.svelte";
  import { formatNumber } from "$/utils/format";
  import ChartArea from "./(components)/chart-area.svelte";
</script>

<div class="relative h-screen w-full overflow-hidden">
  <Header />

  <div class="h-full overflow-y-auto no-scrollbar">
    <main class="flex justify-between gap-6 p-4 pt-24 min-h-full">
      <Sidebar />

      <div class="flex-1 flex flex-col gap-6 min-w-0">
        {@render Metrics()}
        <ChartArea />
        <!-- <DashboardMetrics />
        <PerformanceChart />
        <TickerList /> -->
      </div>
    </main>
  </div>
</div>

{#snippet Metrics()}
  <div
    class="flex flex-col xl:flex-row gap-8 xl:items-center justify-between p-6 bg-accent text-accent-foreground rounded"
  >
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <Wallet class="h-5 w-5" />
        <span class="text-lg">Current</span>
      </div>
      <div class="text-5xl md:text-4xl lg:text-5xl font-bold">
        {formatNumber(6810)}
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 xl:gap-16">
      <div class="flex flex-col gap-1">
        <span class="text-sm">Invested</span>
        <span class="text-2xl md:text-xl lg:text-2xl font-semibold">$5,220</span
        >
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">Total Returns</span>
        <span
          class="text-2xl md:text-xl lg:text-2xl font-semibold text-[#86efac]"
          >+{formatNumber(1590)}</span
        >
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">Net Returns</span>
        <span
          class="text-2xl md:text-xl lg:text-2xl font-semibold text-[#86efac]"
          >+30.46%</span
        >
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">1 Day Returns</span>
        <span
          class="text-2xl md:text-xl lg:text-2xl font-semibold text-[#86efac]"
          >+{formatNumber(142.5)}</span
        >
      </div>
    </div>
  </div>
{/snippet}
