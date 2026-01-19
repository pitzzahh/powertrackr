<script lang="ts">
  import { formatNumber } from "$/utils/format";
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import { Table, TableBody, TableCell, TableRow } from "$lib/components/ui/table";
  import type { ExtendedBillingInfoTableView } from "$lib/types/billing-info";

  interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    billingInfo: ExtendedBillingInfoTableView;
  }

  let { open, onOpenChange, billingInfo }: Props = $props();
</script>

<Dialog {open} {onOpenChange}>
  <DialogContent class="min-w-xl">
    <DialogHeader>
      <DialogTitle>Sub Payments for [{billingInfo.date}]</DialogTitle>
    </DialogHeader>
    <ScrollArea class="max-h-96">
      {#each billingInfo.subMeters as subMeter}
        <div class="space-y-2">
          <h3 class="text-md mb-2 font-semibold">Sub Meter {subMeter.id}</h3>
          <div class="overflow-hidden rounded-md border bg-background">
            <Table>
              <TableBody>
                <TableRow
                  class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r"
                >
                  <TableCell class="bg-muted/50 py-2 font-medium">Sub kWh</TableCell>
                  <TableCell class="py-2">{subMeter.subkWh}kWh</TableCell>
                </TableRow>
                <TableRow
                  class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r"
                >
                  <TableCell class="bg-muted/50 py-2 font-medium">Latest Reading</TableCell>
                  <TableCell class="py-2">{subMeter.reading}</TableCell>
                </TableRow>
                <TableRow
                  class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r"
                >
                  <TableCell class="bg-muted/50 py-2 font-medium">Payment Amount</TableCell>
                  <TableCell class="py-2">{formatNumber(subMeter.payment.amount)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      {/each}
    </ScrollArea>
  </DialogContent>
</Dialog>
