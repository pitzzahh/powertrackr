<script lang="ts">
  import "./layout.css";
  import { mode, ModeWatcher, toggleMode } from "mode-watcher";
  import favicon from "#lib/assets/favicon.svg";
  import FocusRing from "#lib/components/focus-ring.svelte";
  import Header from "#routes/(components)/header.svelte";
  import { site } from "#lib/site.js";
  import SidebarContent from "#routes/(components)/sidebar-content.svelte";
  import { scale } from "svelte/transition";
  import { setSidebarStore } from "#lib/stores/sidebar.svelte.js";
  import { setBillingStore } from "#lib/stores/billing.svelte.js";
  import { setLatestBillingStore } from "#lib/stores/latest-billing.svelte.js";
  import { Toaster } from "svelte-sonner";
  import { untrack } from "svelte";
  import { refreshAll, onNavigate } from "$app/navigation";
  import { setConsumptionStore } from "#lib/stores/consumption.svelte.js";
  import { RenderScan } from "svelte-render-scan";
  import { dev, browser } from "$app/env";
  import { page } from "$app/state";
  import { IsMobile } from "#lib/hooks/is-mobile.svelte.js";
  import SvelteSeo from "svelte-seo";
  import { isEditableTarget } from "#lib/utils/index.js";
  import { isPublicRouteId } from "#lib/utils/constant.js";
  import { setPendingFetch } from "#lib/hooks/use-pending-fetch.svelte.js";
  import { Agentation } from "sv-agentation";

  const { children, data } = $props();

  const sidebar = setSidebarStore();
  const isMoile = new IsMobile();

  const isFullyAuthenticated = $derived(
    !!data.session &&
      !!data.user &&
      (data.user.isOauthUser || data.user.emailVerified) &&
      (!data.user.registeredTwoFactor || data.session.twoFactorVerified)
  );

  const isPublicRoute = $derived(isPublicRouteId(page.route.id));

  const showAppShell = $derived(isFullyAuthenticated && !isPublicRoute);

  // Initialize sidebar state from server data immediately
  untrack(() => sidebar.init(data.sidebarCollapsed));

  // Initialize billing store context
  setBillingStore();
  setLatestBillingStore();
  // Initialize consumption store context
  setConsumptionStore();
  setPendingFetch();

  onNavigate((navigation) => {
    if (navigation.shallow) return;
    if (!document.startViewTransition) return;
    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

  // Keep the browser chrome (theme-color meta) in sync with the active theme.
  $effect(() => {
    if (!browser) return;
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", mode.current === "dark" ? "#1a1a21" : "#f7f7f9");
  });
</script>

{#if browser && dev}
  <Agentation toolbarPosition="bottom-left" workspaceRoot="~/development/powertrackr" />
{/if}

<ModeWatcher />
{#if !isMoile.current}
  <FocusRing />
{/if}
<Toaster theme={mode.current} expand position="top-right" />
{#if dev}
  <RenderScan />
{/if}

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<svelte:window
  onclose={() => refreshAll()}
  onkeydown={(e) => {
    // Only consider the plain "d" key (no modifiers)
    if (e.key !== "d") return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

    // If focus is in an editable control, don't toggle
    if (isEditableTarget(e.target)) return;

    toggleMode();
  }}
/>

<SvelteSeo
  title="{site.name} | {site.description}"
  description={site.description}
  keywords={site.keywords}
  canonical={site.url}
  openGraph={{
    title: site.name,
    description: site.description,
    url: site.url,
    site_name: site.name,
    images: [
      {
        url: site.ogImage,
        width: 1200,
        height: 630,
        alt: site.name,
      },
    ],
    type: "website",
  }}
/>

<main>
  {#if showAppShell}
    <div class="relative h-screen w-full overflow-hidden">
      <Header user={data.user} />

      <div class="no-scrollbar h-full overflow-y-auto">
        <div class="flex min-h-full justify-between gap-4 px-4 pt-16">
          <aside
            in:scale={{ duration: 150 }}
            class={[
              {
                "sticky top-17 hidden h-[calc(100vh-5.5rem)] flex-col overflow-visible rounded-md border border-sidebar-border bg-sidebar p-4 shadow-sm transition-all duration-300 ease-in-out lg:flex": true,
                "w-16": sidebar.collapsed,
                "md:w-48 lg:w-54": !sidebar.collapsed,
              },
            ]}
          >
            <SidebarContent open={false} user={data.user} isMobileSheet={false} />
          </aside>
          <div class="flex min-w-0 flex-1 flex-col gap-4 py-1">
            {@render children()}
          </div>
        </div>
      </div>
    </div>
  {:else}
    {@render children()}
  {/if}
</main>
