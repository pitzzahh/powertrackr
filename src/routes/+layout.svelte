<script lang="ts">
  import "./layout.css";
  import { ModeWatcher } from "mode-watcher";
  import favicon from "$lib/assets/favicon.svg";
  import FocusRing from "$lib/components/focus-ring.svelte";
  import Header from "$routes/(components)/header.svelte";
  import SidebarContent from "$routes/(components)/sidebar-content.svelte";

  const { children } = $props();
</script>

<ModeWatcher />
<FocusRing />

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="relative h-screen w-full overflow-hidden">
  <Header />

  <div class="h-full overflow-y-auto no-scrollbar">
    <main class="flex justify-between gap-6 p-4 pt-24 min-h-full">
      <aside
        class="sticky rounded-md top-24 h-[calc(100vh-8rem)] md:w-48 lg:w-54 bg-muted hidden md:flex flex-col p-4 overflow-y-auto"
      >
        <SidebarContent />
      </aside>
      <div class="flex-1 flex flex-col gap-6 min-w-0">
        {@render children()}
      </div>
    </main>
  </div>
</div>
