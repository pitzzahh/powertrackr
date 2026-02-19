<script module lang="ts">
  import type { AsyncState } from "$/types/state";

  interface LandingFooterProps {
    user: App.Locals["user"];
    asyncState: AsyncState;
  }
</script>

<script lang="ts">
  import Logo from "$/components/logo.svelte";
  import { site } from "$/site";
  import { ChartLine, Users, Shield, Download, Loader } from "$lib/assets/icons";
  import { LANDING_NAV_ITEMS, handleLandingNavClick } from ".";
  import { Button } from "$/components/ui/button";
  import { Skeleton } from "$/components/ui/skeleton";

  let { user, asyncState }: LandingFooterProps = $props();
</script>

<footer class="relative z-10 border-t border-border/50 bg-muted/30 py-16">
  <div class="container mx-auto px-4">
    <div class="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
      <!-- Brand Column -->
      <div class="space-y-4">
        <Logo variant="ghost" class="px-0 md:pl-0!" viewTransitionName="logo-footer" />
        <p class="text-sm text-muted-foreground">
          {site.description}
        </p>
        <p class="text-sm text-muted-foreground">
          Software-focused tracking and billing for practical expense allocation.
        </p>
      </div>

      <!-- Navigation Links -->
      <div class="space-y-4">
        <h3 class="text-sm font-semibold tracking-wider text-foreground uppercase">Navigation</h3>
        <ul class="space-y-3">
          {#each LANDING_NAV_ITEMS as item}
            <li>
              <a
                href={item.href}
                onclick={(e) => handleLandingNavClick(e, item.href)}
                class="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                {item.label}
              </a>
            </li>
          {/each}
        </ul>
      </div>

      <!-- Features Highlight -->
      <div class="space-y-4">
        <h3 class="text-sm font-semibold tracking-wider text-foreground uppercase">Features</h3>
        <ul class="space-y-3">
          <li class="flex items-center gap-2 text-sm text-muted-foreground">
            <ChartLine class="h-4 w-4 text-primary" />
            <span>Billing Summaries</span>
          </li>
          <li class="flex items-center gap-2 text-sm text-muted-foreground">
            <Users class="h-4 w-4 text-primary" />
            <span>User Accounts</span>
          </li>
          <li class="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield class="h-4 w-4 text-primary" />
            <span>Input Validation</span>
          </li>
          <li class="flex items-center gap-2 text-sm text-muted-foreground">
            <Download class="h-4 w-4 text-primary" />
            <span>Import & Export</span>
          </li>
        </ul>
      </div>

      <!-- Use Cases -->
      <div class="space-y-4">
        <h3 class="text-sm font-semibold tracking-wider text-foreground uppercase">Built For</h3>
        <ul class="space-y-3">
          <li class="text-sm text-muted-foreground">Multi-Tenant Buildings</li>
          <li class="text-sm text-muted-foreground">Homeowners with Rentals</li>
          <li class="text-sm text-muted-foreground">Property Managers</li>
        </ul>
      </div>
    </div>

    <!-- Divider -->
    <div class="my-10 h-px bg-border/50"></div>

    <!-- Bottom Row -->
    <div class="flex flex-col items-center justify-between gap-4 md:flex-row">
      <p class="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()}
        {site.name}. All rights reserved.
      </p>
      <div class="flex items-center gap-6">
        {#if asyncState === "processing"}
          <Skeleton class="h-6 w-28 rounded-md" />
        {:else if user}
          <a
            href="/dashboard"
            class="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Go to Dashboard
          </a>
        {:else}
          <a
            href="/auth?act=login"
            class="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Sign In
          </a>
          <a
            href="/auth?act=register"
            class="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Get Started
          </a>
        {/if}
      </div>
    </div>
  </div>
</footer>
