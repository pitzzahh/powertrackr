<script module lang="ts">
  import { getLatestBillingInfo } from "$/api/billing-info.remote";
  import { TriangleAlert } from "$lib/assets/icons";
  import { ScrollArea } from "$/components/ui/scroll-area";
  import type { BillingInfoWithSubMetersFormProps } from "$routes/history/(components)/billing-info-form.svelte";
  import type { BillingInfoDTOWithSubMeters } from "$/types/billing-info";
  import { BillingInfoForm } from "$routes/history/(components)";

  export type WarningBannerProps = {
    message: string;
  };

  export { WarningBanner, LoadingDots, NewBill };
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

{#snippet NewBill(callback: BillingInfoWithSubMetersFormProps["callback"], userId: string)}
  <ScrollArea class="h-[calc(100vh-50px)] overflow-y-auto pr-2.5">
    {@const billingInfo = getLatestBillingInfo({ userId })}
    <div class="space-y-4 p-4">
      {#key billingInfo.current}
        {@const latestBillingInfo =
          (billingInfo.current?.value[0] as BillingInfoDTOWithSubMeters | undefined) ?? undefined}

        <BillingInfoForm action="add" {callback} billingInfo={latestBillingInfo} />
      {/key}
    </div>
  </ScrollArea>
{/snippet}
