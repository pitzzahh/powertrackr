<script lang="ts">
  import { Separator } from "$/components/ui/separator/index.js";
  import { formatNumber } from "$/utils/format";
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import { Table, TableBody, TableCell, TableRow } from "$lib/components/ui/table";
  import type { ExtendedBillingInfoTableView } from "$lib/types/billing-info";
  import { cubicInOut } from "svelte/easing";
  import { scale } from "svelte/transition";

  interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    billingInfo: ExtendedBillingInfoTableView;
  }

  let { open, onOpenChange, billingInfo }: Props = $props();
</script>

<Dialog {open} {onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Sub Payments for [{billingInfo.date}]</DialogTitle>
    </DialogHeader>
    <ScrollArea class="max-h-96">
      {#each billingInfo.subMeters as subMeter, index}
        <div
          class="space-y-2"
          in:scale={{ duration: 1000, delay: index * 100, easing: cubicInOut }}
        >
          <h3 class="text-md mb-2 font-semibold">Sub Meter [{subMeter.label}]</h3>
          <div class="overflow-hidden rounded-md border bg-background">
            <Table>
              <TableBody>
                <TableRow
                  class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r"
                >
                  <TableCell class="bg-muted/50 py-2 font-medium">Reading</TableCell>
                  <TableCell class="py-2">{subMeter.reading}</TableCell>
                </TableRow>
                <TableRow
                  class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r"
                >
                  <TableCell class="bg-muted/50 py-2 font-medium">Used kWh</TableCell>
                  <TableCell class="py-2">{subMeter.subkWh} kWh</TableCell>
                </TableRow>
                <TableRow
                  class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r"
                >
                  <TableCell class="bg-muted/50 py-2 font-medium">Payment Amount</TableCell>
                  <TableCell class="py-2">{formatNumber(subMeter.payment?.amount || 0)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        {#if index % 2 == 0}
          <Separator class="my-6 w-full" />
        {/if}
      {/each}
    </ScrollArea>
  </DialogContent>
</Dialog>
