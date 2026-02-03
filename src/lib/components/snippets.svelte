<script module lang="ts">
  import { TriangleAlert } from "$lib/assets/icons";
  import type { BillingInfoWithSubMetersFormProps } from "$routes/history/(components)/billing-info-form.svelte";
  import type { BillingInfoDTOWithSubMeters } from "$/types/billing-info";
  import { BillingInfoForm as OriginalBillingInfoForm } from "$routes/history/(components)";

  export type WarningBannerProps = {
    message: string;
  };

  export { WarningBanner, LoadingDots, BillingInfoForm };
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
  action: BillingInfoWithSubMetersFormProps["action"],
  billingInfo?: BillingInfoDTOWithSubMeters
)}
  <div class="space-y-4 p-4 pb-8">
    <OriginalBillingInfoForm {action} {callback} {billingInfo} />
  </div>
{/snippet}
