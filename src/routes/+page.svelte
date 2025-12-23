<script lang="ts">
  import Header from "./(components)/header.svelte";
  import Sidebar from "./(components)/sidebar.svelte";
</script>

<div class="relative h-screen w-full overflow-hidden">
  <Header />

  <div class="h-full overflow-y-auto no-scrollbar">
    <main class="flex gap-6 p-6 pt-24 min-h-full">
      <Sidebar />

      <div class="flex-1 flex flex-col gap-6 min-w-0">
        <!-- <DashboardMetrics />
        <PerformanceChart />
        <TickerList /> -->
      </div>
    </main>
  </div>
</div>
