<script lang="ts">
  import { resolve } from "$app/paths";
  import { browser } from "$app/env";
  import Logo from "#lib/components/logo.svelte";
  import { site } from "#lib/site.js";
  import { getStats } from "#lib/api/stats.remote.js";
  import { formatNumber } from "#lib/utils/format.js";
  import { convertEnergy, getEnergyUnit } from "#lib/utils/converter/energy.js";
  import { LANDING_NAV_ITEMS, handleLandingNavClick } from ".";
  import HeroCta from "./hero-cta.svelte";

  const statsQuery = browser ? getStats() : null;
  // Only shown once real numbers arrive; the prerendered page would otherwise say "0 bills".
  const stats = $derived(statsQuery?.current?.billingCount ? statsQuery.current : null);
</script>

<!-- `dark` scopes the dark tokens, so this band is ink in both themes. -->
<footer class="dark bg-background text-foreground">
  <div class="container mx-auto px-4 py-20">
    <h2 class="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
      Start with this month's bill. It takes a few minutes.
    </h2>
    <HeroCta />
    {#if stats}
      <p class="mt-6 text-sm text-muted-foreground tabular-nums">
        {formatNumber(stats.billingCount, { style: "decimal" })} bills,
        {formatNumber(convertEnergy(stats.energyUsed.total, stats.energyUsed.energyUnit), {
          style: "decimal",
        })}
        {getEnergyUnit(stats.energyUsed.total)} and {formatNumber(stats.paymentsAmount.total)} in payments
        recorded so far.
      </p>
    {/if}
  </div>

  <div
    class="container mx-auto flex flex-col gap-6 border-t px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between"
  >
    <Logo variant="ghost" class="w-auto px-0 md:pl-0!" viewTransitionName="logo-footer" />

    <nav aria-label="Footer">
      <ul class="flex flex-wrap gap-x-6 gap-y-2">
        {#each LANDING_NAV_ITEMS as item (item.href)}
          <li>
            <a
              href={resolve(item.href)}
              onclick={(e) => handleLandingNavClick(e, item.href)}
              class="hover:text-foreground"
            >
              {item.label}
            </a>
          </li>
        {/each}
        <li><a href={resolve("privacy")} class="hover:text-foreground">Privacy</a></li>
        <li><a href={resolve("terms")} class="hover:text-foreground">Terms</a></li>
      </ul>
    </nav>

    <p>© {new Date().getFullYear()} {site.name}</p>
  </div>
</footer>
