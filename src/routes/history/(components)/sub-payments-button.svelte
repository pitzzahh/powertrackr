<script lang="ts">
  import { CreditCard } from "$/assets/icons";
  import Button, { type ButtonProps } from "$/components/ui/button/button.svelte";
  import SubPaymentsDialog from "./sub-payments-dialog.svelte";
  import type { ExtendedBillingInfoTableView } from "$/types/billing-info";

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
