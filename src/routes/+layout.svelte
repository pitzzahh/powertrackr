<script lang="ts" module>
  type LayoutState = {
    pendingCount: number;
  };
</script>

<script lang="ts">
  import "./layout.css";
  import { mode, ModeWatcher } from "mode-watcher";
  import favicon from "$/assets/favicon.svg";
  import FocusRing from "$/components/focus-ring.svelte";
  import Header from "$routes/(components)/header.svelte";
  import { site } from "$/site";

  import SidebarContent from "$routes/(components)/sidebar-content.svelte";
  import { scale } from "svelte/transition";
  import { pendingFetchContext } from "$/context.js";
  import { sidebarStore } from "$/stores/sidebar.svelte";
  import { Toaster } from "svelte-sonner";
  import { untrack } from "svelte";

  const { children, data } = $props();

  // Initialize sidebar state from server data immediately
  untrack(() => sidebarStore.init(data.sidebarCollapsed));

  let { pendingCount }: LayoutState = $state({
    pendingCount: 0,
  });

  const ctx = pendingFetchContext;
  ctx.set({
    get count() {
      return pendingCount;
    },
    add() {
      pendingCount++;
    },
    delete() {
      pendingCount--;
    },
    reset() {
      pendingCount = 0;
    },
  });
</script>

<ModeWatcher />
<FocusRing />
<Toaster theme={mode.current} position="bottom-right" closeButton={false} />

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

{#if data.user?.emailVerified && data.session && (!data.user?.registeredTwoFactor || data.session?.twoFactorVerified)}
  <div class="relative h-screen w-full overflow-hidden">
    <Header user={data.user} />

    <div class="no-scrollbar h-full overflow-y-auto">
      <main class="flex min-h-full justify-between gap-4 pt-16 pr-2 pl-4">
        <aside
          in:scale={{ duration: 150 }}
          class={[
            {
              "sticky top-17 hidden h-[calc(100vh-5.5rem)] flex-col overflow-visible rounded-md border bg-card p-4 shadow-sm transition-all duration-300 ease-in-out lg:flex": true,
              "w-16": sidebarStore.collapsed,
              "md:w-48 lg:w-54": !sidebarStore.collapsed,
            },
          ]}
        >
          <SidebarContent open={false} user={data.user} isMobileSheet={false} />
        </aside>
        <div class="flex min-w-0 flex-1 flex-col gap-4 py-1">
          {@render children()}
        </div>
      </main>
    </div>
  </div>
{:else}
  {@render children()}
{/if}
