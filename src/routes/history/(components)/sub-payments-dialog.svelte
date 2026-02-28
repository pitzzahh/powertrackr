<script lang="ts">
  import { Separator } from "$/components/ui/separator/index.js";
  import { formatNumber } from "$/utils/format";
  import { convertToNormalText } from "$/utils/text";
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

  let { open = $bindable(false), onOpenChange, billingInfo }: Props = $props();
</script>

<Dialog bind:open {onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Sub Payments for [{billingInfo.dateFormatted}]</DialogTitle>
    </DialogHeader>
    <ScrollArea class="max-h-96 pr-2.5">
      {#each billingInfo.subMeters as subMeter, index}
        <div
          class="space-y-2"
          in:scale={{ duration: 1000, delay: index * 100, easing: cubicInOut }}
        >
          <h3 class="text-md mb-2 font-semibold">Sub Meter [{subMeter.label}]</h3>
          <div class="max-w-full overflow-x-auto rounded-md border bg-background">
            <Table class="min-w-0 table-fixed">
              <TableBody>
                <TableRow
                  class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r"
                >
                  <TableCell
                    class="min-w-0 bg-muted/50 py-2 font-medium wrap-break-word whitespace-normal"
                    >Status</TableCell
                  >
                  <TableCell class="min-w-0 py-2 wrap-break-word whitespace-normal"
                    >{convertToNormalText(subMeter.status)}</TableCell
                  >
                </TableRow>
                <TableRow
                  class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r"
                >
                  <TableCell
                    class="min-w-0 bg-muted/50 py-2 font-medium wrap-break-word whitespace-normal"
                    >Reading</TableCell
                  >
                  <TableCell class="min-w-0 py-2 wrap-break-word whitespace-normal"
                    >{subMeter.reading}</TableCell
                  >
                </TableRow>
                <TableRow
                  class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r"
                >
                  <TableCell
                    class="min-w-0 bg-muted/50 py-2 font-medium wrap-break-word whitespace-normal"
                    >Used kWh</TableCell
                  >
                  <TableCell class="min-w-0 py-2 wrap-break-word whitespace-normal"
                    >{subMeter.subkWh} kWh</TableCell
                  >
                </TableRow>
                <TableRow
                  class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r"
                >
                  <TableCell
                    class="min-w-0 bg-muted/50 py-2 font-medium wrap-break-word whitespace-normal"
                    >Payment Amount</TableCell
                  >
                  <TableCell class="min-w-0 py-2 wrap-break-word whitespace-normal"
                    >{formatNumber(subMeter.payment?.amount || 0)}</TableCell
                  >
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        {#if index < billingInfo.subMeters.length - 1}
          <Separator class="my-6 w-full" />
        {/if}
      {/each}
    </ScrollArea>
  </DialogContent>
</Dialog>
