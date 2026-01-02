<script lang="ts">
  import "./layout.css";
  import { ModeWatcher } from "mode-watcher";
  import favicon from "$/assets/favicon.svg";
  import FocusRing from "$/components/focus-ring.svelte";
  import Header from "$routes/(components)/header.svelte";
  import { Toaster } from "$/components/ui/sonner/index.js";
  import { site } from "$/site";

  import SidebarContent from "$routes/(components)/sidebar-content.svelte";
  import { scale } from "svelte/transition";

  const { children, data } = $props();
</script>

<ModeWatcher />
<FocusRing />
<Toaster />

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>{site.name}: {site.description}</title>
  <meta name="author" content={site.author} />
  <meta name="description" content={site.description} />
  <meta name="keywords" content={site.keywords} />
  <meta property="og:title" content={site.name} />
  <meta property="og:description" content={site.description} />
  <meta property="og:site_name" content={site.name} />
  <meta property="og:image" content={site.ogImage} />
  <meta property="og:url" content={site.url} />
  <meta property="og:type" content="website" />
</svelte:head>

{#if data.user && data.session}
  <div class="relative h-screen w-full overflow-hidden">
    <Header />

    <div class="h-full overflow-y-auto no-scrollbar">
      <main class="flex justify-between gap-4 p-4 pt-16 min-h-full">
        <aside
          in:scale={{ duration: 150 }}
          class="sticky rounded-md top-17 h-[calc(100vh-5.5rem)] md:w-48 lg:w-54 bg-card border shadow-sm hidden lg:flex flex-col p-4 overflow-y-auto"
        >
          <SidebarContent open={false} />
        </aside>
        <div class="flex-1 flex flex-col gap-4 min-w-0 p-1">
          {@render children()}
        </div>
      </main>
    </div>
  </div>
{:else}
  {@render children()}
{/if}
