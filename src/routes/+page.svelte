<script lang="ts">
  import { Wallet } from "@lucide/svelte";
  import { formatNumber } from "$/utils/format";
  import ChartArea from "$routes/(components)/chart-area.svelte";
  import { scale } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
</script>

{@render Metrics()}
<section in:scale={{ duration: 350, easing: cubicInOut, start: 0.8 }}>
  <ChartArea />
</section>

{#snippet Metrics()}
  <section
    in:scale={{ duration: 250, easing: cubicInOut, start: 0.8 }}
    class="flex flex-col xl:flex-row gap-8 xl:items-center justify-between p-6 bg-muted text-muted-foreground rounded-md"
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
          class="text-2xl md:text-xl lg:text-2xl font-semibold text-green-600"
          >+{formatNumber(1590)}</span
        >
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">Net Returns</span>
        <span
          class="text-2xl md:text-xl lg:text-2xl font-semibold text-green-600"
          >+30.46%</span
        >
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-sm">1 Day Returns</span>
        <span
          class="text-2xl md:text-xl lg:text-2xl font-semibold text-green-600"
          >+{formatNumber(142.5)}</span
        >
      </div>
    </div>
  </section>
{/snippet}
