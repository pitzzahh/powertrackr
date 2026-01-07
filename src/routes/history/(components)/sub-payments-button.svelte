<script lang="ts">
  import { CreditCard } from "$/assets/icons";
  import Button, {
    type ButtonProps,
    type ButtonVariant,
  } from "$/components/ui/button/button.svelte";
  import SubPaymentsDialog from "./sub-payments-dialog.svelte";
  import type { ExtendedBillingInfoTableView } from "$/types/billing-info";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

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

  let buttonSize = $derived(children ? "default" : size);
</script>

<Button
  variant="outline"
  size={buttonSize}
  title="View Sub Payments"
  onclick={() => (open = true)}
  class={className}
  {...rest}
>
  <CreditCard />
  {@render children?.()}
</Button>

<SubPaymentsDialog {open} onOpenChange={(o) => (open = o)} billingInfo={row} />
