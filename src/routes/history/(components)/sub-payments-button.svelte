<script lang="ts">
  import { CreditCard } from "$/assets/icons";
  import Button from "$/components/ui/button/button.svelte";
  import SubPaymentsDialog from "./sub-payments-dialog.svelte";
  import type { ExtendedBillingInfoTableView } from "$/types/billing-info";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  let { row, class: className, size = "icon", children }: { row: ExtendedBillingInfoTableView; class?: HTMLButtonAttributes['class'], size?: "icon" | "default" | "sm" | "lg" | "xl" | "icon-sm" | "icon-lg"; children?: Snippet } = $props();

  let open = $state(false);

  let buttonSize = $derived(children ? "default" : size);
</script>

<Button
  variant="outline"
  size={buttonSize}
  title="View Sub Payments"
  onclick={() => (open = true)}
  class={className}
>
  <CreditCard />
  {@render children?.()}
</Button>

<SubPaymentsDialog {open} onOpenChange={(o) => (open = o)} billingInfo={row} />
