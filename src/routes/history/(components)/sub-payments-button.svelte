<script lang="ts">
  import { CreditCard } from "#lib/assets/icons.js";
  import Button, { type ButtonProps } from "#lib/components/ui/button/button.svelte";
  import SubPaymentsDialog from "./sub-payments-dialog.svelte";
  import type { ExtendedBillingInfoTableView } from "#lib/types/billing-info.js";

  let {
    row,
    class: className,
    size = "icon",
    children,
    ...rest
  }: ButtonProps & {
    row: ExtendedBillingInfoTableView;
  } = $props();

  let open = $state(false);
</script>

<Button
  variant="outline"
  size={children ? "default" : size}
  title="View Sub Payments"
  onclick={() => (open = true)}
  class={className}
  {...rest}
>
  <CreditCard />
  {@render children?.()}
</Button>

<SubPaymentsDialog {open} onOpenChange={(o) => (open = o)} billingInfo={row} />
