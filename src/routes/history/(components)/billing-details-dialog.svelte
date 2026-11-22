<script lang="ts" module>
  import type { ExtendedBillingInfoTableView } from "#lib/types/billing-info.js";

  export type BillingDetailsDialogProps = {
    open?: boolean;
    billing: ExtendedBillingInfoTableView;
  };

  const GOOD = "text-success-strong";
  const BAD = "text-destructive-strong";
</script>

<script lang="ts">
  import { Table, TableBody, TableCell, TableRow } from "#lib/components/ui/table/index.js";
  import DynamicModal from "#lib/components/dynamic-modal.svelte";
  import { formatNumber } from "#lib/utils/format.js";
  import { convertToNormalText } from "#lib/utils/text.js";
  import { SubPaymentsButton } from ".";

  let { open = $bindable(false), billing }: BillingDetailsDialogProps = $props();

  const details = $derived([
    { label: "ID", value: billing.id, class: "font-mono text-accent-foreground" },
    { label: "User ID", value: billing.userId, class: "font-mono" },
    { label: "Date", value: billing.dateFormatted, class: "font-mono" },
    { label: "Total kWh", value: `${billing.totalkWh} kWh`, class: "font-semibold" },
    {
      label: "Balance",
      value: formatNumber(billing.balance),
      class: `font-semibold ${billing.balance > 2000 ? BAD : GOOD}`,
    },
    {
      label: "Status",
      value: convertToNormalText(billing.status),
      class: `font-semibold ${billing.status === "paid" ? GOOD : BAD}`,
    },
    { label: "Pay Per kWh", value: formatNumber(billing.payPerkWh), class: "font-semibold" },
    {
      label: "Main Payment",
      value: billing.payment?.amount ? formatNumber(billing.payment.amount) : "N/A",
      class: "font-mono",
    },
  ]);
</script>

<DynamicModal
  bind:open
  title="Billing Info Details"
  description="Comprehensive billing information for {billing.dateFormatted}"
>
  <div class="max-w-full overflow-x-auto rounded-md border bg-background">
    <Table class="w-full">
      <TableBody>
        {#each details as item (item.label)}
          <TableRow class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
            <TableCell class="w-40 bg-muted/50 py-2 font-medium wrap-break-word whitespace-normal">
              {item.label}
            </TableCell>
            <TableCell class="min-w-0 py-2 wrap-break-word whitespace-normal {item.class}">
              {item.value}
            </TableCell>
          </TableRow>
        {/each}
        <TableRow class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
          <TableCell class="w-40 bg-muted/50 py-2 font-medium">Sub Payments</TableCell>
          <TableCell class="min-w-0 py-2">
            <SubPaymentsButton class="w-full" row={billing} size="xs">
              View Sub Payments
            </SubPaymentsButton>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</DynamicModal>
