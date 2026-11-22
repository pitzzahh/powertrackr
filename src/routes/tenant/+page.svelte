<script lang="ts">
  import * as Card from "#lib/components/ui/card/index.js";
  import { InvoiceIcon } from "#lib/assets/icons.js";
  import { getMyMeter, getPendingBillings, getCurrentBilling } from "#lib/api/tenant.remote.js";
  import CurrentBillingCard from "./(components)/current-billing-card.svelte";
  import MyMeterCard from "./(components)/my-meter-card.svelte";
  import PendingReadingForm from "./(components)/pending-reading-form.svelte";

  // Queries drive the page reactively: `.loading`, `.error`, `.current`.
  // Submitting a reading refreshes them server-side (single-flight), so
  // `current` updates without any manual re-fetch.
  const myMeterQuery = getMyMeter({});
  const pendingBillingsQuery = getPendingBillings({});
  const currentBillingQuery = getCurrentBilling({});
</script>

{#snippet notice(text: string, dashed = false)}
  <div
    class={[
      "flex items-center justify-center p-6 text-center text-sm text-muted-foreground",
      dashed && "rounded-lg border border-dashed",
    ]}
  >
    {text}
  </div>
{/snippet}

<div class="space-y-6 pb-4">
  <div class="space-y-2">
    <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">My Meter</h1>
    <p class="text-muted-foreground">Submit your reading when the owner opens a billing period.</p>
  </div>

  {#if myMeterQuery.error}
    {@render notice("Failed to load your meter")}
  {:else if !myMeterQuery.current}
    {@render notice("Loading your meter…")}
  {:else}
    {@const pendings = pendingBillingsQuery.current}
    <div class="grid gap-6 lg:grid-cols-2">
      <MyMeterCard meter={myMeterQuery.current} />
      {#if currentBillingQuery.error}
        {@render notice("Failed to load your billing")}
      {:else if currentBillingQuery.current}
        <CurrentBillingCard billing={currentBillingQuery.current} />
      {/if}
    </div>

    {#if pendings === undefined}
      {@render notice("Loading billings…")}
    {:else if pendings.length === 0}
      {@render notice(
        "No pending billing requests — you'll see submit options here when the owner opens a billing period for you.",
        true
      )}
    {:else}
      <Card.Root>
        <Card.Header class="border-b">
          <h2 class="flex items-center gap-2 text-sm leading-none font-semibold tracking-tight">
            <InvoiceIcon class="h-4 w-4 text-muted-foreground" />
            Billings awaiting your reading
          </h2>
          <Card.Description class="text-xs">
            The owner opened these billing periods — submit your reading for each so they can
            finalize the bill.
          </Card.Description>
        </Card.Header>
        <Card.Content class="grid gap-4 md:grid-cols-2">
          {#each pendings as pending (pending.billingInfoId)}
            <PendingReadingForm {pending} />
          {/each}
        </Card.Content>
      </Card.Root>
    {/if}
  {/if}
</div>
