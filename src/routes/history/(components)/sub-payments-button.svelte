<script lang="ts">
  import { CreditCard } from "$/assets/icons";
  import Button from "$/components/ui/button/button.svelte";
  import SubPaymentsDialog from "./sub-payments-dialog.svelte";
  import type { ExtendedBillingInfoTableView } from "$/types/billing-info";

  let { row }: { row: ExtendedBillingInfoTableView } = $props();

  let open = $state(false);
</script>

<Button
  variant="outline"
  size="icon"
  title="View Sub Payments"
  onclick={() => (open = true)}
>
  <CreditCard />
</Button>

<SubPaymentsDialog {open} onOpenChange={(o) => (open = o)} billingInfo={row} />
