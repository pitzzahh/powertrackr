<script module lang="ts">
  import { getLatestBillingInfo, generateRandomBillingInfos } from "$/api/billing-info.remote";
  import { TriangleAlert } from "$lib/assets/icons";
  import { ScrollArea } from "$/components/ui/scroll-area";
  import type { BillingInfoWithSubMetersFormProps } from "$routes/history/(components)/billing-info-form.svelte";
  import type { BillingInfoDTOWithSubMeters } from "$/types/billing-info";
  import { BillingInfoForm as OriginalBillingInfoForm } from "$routes/history/(components)";
  import { showPromise } from "$/components/toast";
  import { Button } from "$/components/ui/button";
  import { Input } from "$/components/ui/input/";

  export type WarningBannerProps = {
    message: string;
  };
  let count = $state(5);
  let minSubMeters = $state(2);
  let maxSubMeters = $state(5);

  export { WarningBanner, LoadingDots, BillingInfoForm, GenerateRandomBills };
</script>

{#snippet WarningBanner({ message }: WarningBannerProps)}
  <span class="mt-4 block border-l-4 border-amber-500 bg-amber-500/10 p-3" role="alert">
    <span class="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-500">
      <TriangleAlert class="size-4" />
      Warning
    </span>
    <span class="mt-1 block text-sm text-amber-800 dark:text-amber-400">
      {message}
    </span>
  </span>
{/snippet}

{#snippet LoadingDots()}
  <span>
    <span class="animation-delay-0 animate-pulse">.</span>
    <span class="animation-delay-500 animate-pulse">.</span>
    <span class="animation-delay-1000 animate-pulse">.</span>
  </span>
{/snippet}

{#snippet BillingInfoForm(
  callback: BillingInfoWithSubMetersFormProps["callback"],
  userId: string,
  action: BillingInfoWithSubMetersFormProps["action"]
)}
  {@const billingInfo = getLatestBillingInfo({ userId })}
  <div class="space-y-4 p-4 pb-8">
    {#key billingInfo.current}
      {@const latestBillingInfo =
        (billingInfo.current?.value[0] as BillingInfoDTOWithSubMeters | undefined) ?? undefined}

      <OriginalBillingInfoForm {action} {callback} billingInfo={latestBillingInfo} />
    {/key}
  </div>
{/snippet}

{#snippet GenerateRandomBills(callback: BillingInfoWithSubMetersFormProps["callback"])}
  <div class="space-y-4 p-4 pb-8">
    <div class="space-y-2">
      <label for="count" class="text-sm font-medium">Number of Billing Infos</label>
      <Input type="number" id="count" bind:value={count} min="1" max="100" required />
    </div>
    <div class="space-y-2">
      <label for="minSubMeters" class="text-sm font-medium">Min Sub Meters per Bill</label>
      <Input type="number" id="minSubMeters" bind:value={minSubMeters} min="0" max="10" required />
    </div>
    <div class="space-y-2">
      <label for="maxSubMeters" class="text-sm font-medium">Max Sub Meters per Bill</label>
      <Input type="number" id="maxSubMeters" bind:value={maxSubMeters} min="0" max="10" required />
    </div>
    <Button
      onclick={() =>
        showPromise(
          generateRandomBillingInfos({
            count,
            minSubMeters,
            maxSubMeters,
          }),
          {
            loading: {
              title: "Generating Bills",
              description: "Please wait while we generate the random billing infos.",
            },
            success: {
              title: "Success",
              description: "Random billing infos have been generated successfully.",
            },
            error: {
              title: "Error",
              description: "Failed to generate random billing infos.",
            },
            onSuccess: (d) => {
              callback?.(d.valid, "add", {
                error: d.message,
              });
            },
            onError: (d) => {
              callback?.(false, "add", {
                error: d,
              });
            },
          }
        )}
      class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      Generate Random Bills
    </Button>
  </div>
{/snippet}
