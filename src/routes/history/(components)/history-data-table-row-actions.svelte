<script module lang="ts">
  export interface BillingInfoDataTableRowActionsProps {
    row: Row<ExtendedBillingInfoTableView>;
  }
  interface ComponentState {
    app_state: "stale" | "processing";
    active_dialog_content: "view" | "remove";
    open_view: boolean;
    open_edit: boolean;
    delete_confirm_value: string;
  }
</script>

<script lang="ts">
  import { Loader, Trash2, View, Pencil, Ticket } from "$/assets/icons";
  import { Table, TableBody, TableCell, TableRow } from "$lib/components/ui/table";
  import { BillingInfoForm, SubPaymentsButton } from ".";
  import { formatDate, formatNumber, parseCalendarDate } from "$/utils/format";
  import type { Row } from "@tanstack/table-core";
  import Button from "$/components/ui/button/button.svelte";
  import * as Dialog from "$/components/ui/dialog";
  import { showInspectorWarning, showSuccess, showWarning } from "$/components/toast";
  import * as Sheet from "$/components/ui/sheet/index.js";
  import { ScrollArea } from "$/components/ui/scroll-area";
  import type { ExtendedBillingInfoTableView } from "$/types/billing-info";
  import { LoadingDots, WarningBanner } from "$/components/snippets.svelte";
  import { Input } from "$/components/ui/input";
  import { deleteBillingInfo } from "$/api/billing-info.remote";
  import { useBillingStore } from "$/stores/billing.svelte";
  import { useConsumptionStore } from "$/stores/consumption.svelte";
  import { billingInfoToDto } from "$/utils/mapper/billing-info";

  let { row }: BillingInfoDataTableRowActionsProps = $props();

  const billingStore = useBillingStore();
  const consumptionStore = useConsumptionStore();

  let { app_state, active_dialog_content, open_view, open_edit, delete_confirm_value } =
    $state<ComponentState>({
      app_state: "stale",
      active_dialog_content: "view",
      open_view: false,
      open_edit: false,
      delete_confirm_value: "",
    });

  const BILLING_DETAILS = $derived([
    {
      label: "ID",
      value: row.original.id,
      class: "font-mono text-primary",
    },
    {
      label: "User ID",
      value: row.original.userId,
      class: "font-mono",
    },
    {
      label: "Date",
      value: formatDate(parseCalendarDate(row.original.date)),
      class: "font-mono",
    },
    {
      label: "Total kWh",
      value: `${row.original.totalkWh} kWh`,
      class: "font-semibold",
    },
    {
      label: "Balance",
      value: formatNumber(row.original.balance),
      class: `font-semibold ${row.original.balance > 2000 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`,
    },
    {
      label: "Status",
      value: row.original.status,
      class: `font-semibold ${row.original.status === "Paid" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`,
    },
    {
      label: "Pay Per kWh",
      value: formatNumber(row.original.payPerkWh),
      class: "font-semibold",
    },
    {
      label: "Main Payment",
      value: row.original.payment?.amount ? formatNumber(row.original.payment.amount) : "N/A",
      class: "font-mono",
    },
  ]);

  async function handle_remove_billing_info() {
    if (delete_confirm_value != row.original.date) {
      return showInspectorWarning();
    }
    app_state = "processing";

    const { valid, value, message } = await deleteBillingInfo({
      id: row.original.id,
      count: 1,
    });

    if (!valid || value != 1) {
      app_state = "stale";
      open_view = false;
      return showWarning(
        "Failed to remove billing info. It may not exist or already removed.",
        `More info: ${message || "unknown reason"}`
      );
    }
    app_state = "stale";
    open_view = false;
    billingStore.refresh();
    return showSuccess(`Billing info${value > 1 ? "s" : ""} deleted successfully`, message);
  }
</script>

<div class="flex items-center justify-center gap-2">
  <Button
    size="icon"
    variant="outline"
    title="View Billing Info Details"
    onclick={() => {
      active_dialog_content = "view";
      open_view = true;
    }}
  >
    <View />
  </Button>
  <Button
    size="icon"
    variant="outline"
    title="Edit Billing Info Details"
    onclick={() => {
      open_edit = true;
    }}
  >
    <Pencil />
  </Button>

  <Button
    size="icon"
    variant="destructive"
    title="Remove Billing Info Record"
    onclick={() => {
      active_dialog_content = "remove";
      open_view = true;
    }}
  >
    <Trash2 />
  </Button>
</div>

<Dialog.Root
  bind:open={open_view}
  onOpenChange={(open) => {
    if (!open && app_state === "processing") {
      showWarning("Process Interrupted", "The operation is still processing. Please wait...");
      open_view = true;
    }
  }}
>
  {#if active_dialog_content === "view"}
    <Dialog.Content class="md:max-h-132.5 md:max-w-237.5 lg:max-w-250">
      <Dialog.Header>
        <Dialog.Title class="flex items-center gap-2 text-3xl font-bold">
          <Ticket class="size-6" />
          Billing Info Details
        </Dialog.Title>
        <Dialog.Description class="mt-2 text-lg text-muted-foreground">
          Comprehensive billing information for
          <span class="font-mono text-primary"
            >{formatDate(parseCalendarDate(row.original.date))}</span
          >
        </Dialog.Description>
      </Dialog.Header>
      <ScrollArea class="max-h-[60vh] pr-2.5">
        <div class="max-w-full overflow-x-auto rounded-md border bg-background">
          <Table class="w-full">
            <TableBody>
              {#each BILLING_DETAILS as item}
                <TableRow
                  class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r"
                >
                  <TableCell
                    class="min-w-0 bg-muted/50 py-2 font-medium wrap-break-word whitespace-normal"
                    >{item.label}</TableCell
                  >
                  <TableCell class="min-w-0 py-2 wrap-break-word whitespace-normal {item.class}"
                    >{item.value}</TableCell
                  >
                </TableRow>
              {/each}
              <TableRow class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell
                  class="min-w-0 bg-muted/50 py-2 font-medium wrap-break-word whitespace-normal"
                  >Sub Payments</TableCell
                >
                <TableCell class="min-w-0 py-2 wrap-break-word whitespace-normal">
                  <SubPaymentsButton class="w-full" row={row.original} size="xs"
                    >View Sub Payments</SubPaymentsButton
                  >
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    </Dialog.Content>
  {/if}

  {#if active_dialog_content === "remove"}
    {@const currentDate = formatDate(parseCalendarDate(row.original.date))}
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Remove Billing Info Record</Dialog.Title>
        <Dialog.Description>
          Are you sure you want to remove this billing info record? This action cannot be undone.
          {@render WarningBanner({
            message: "Removing this will also remove the sub meter billing informations.",
          })}
        </Dialog.Description>
      </Dialog.Header>
      <Input
        bind:value={delete_confirm_value}
        type="text"
        placeholder={currentDate}
        class="text-center"
      />
      <Dialog.Footer>
        <Button
          variant="secondary"
          disabled={app_state === "processing"}
          onclick={() => {
            open_view = false;
            delete_confirm_value = "";
          }}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onclick={handle_remove_billing_info}
          disabled={delete_confirm_value != currentDate || app_state === "processing"}
          title="Confirm Delete Billing Info {currentDate}"
        >
          {#if app_state === "processing"}
            <Loader class="size-4 animate-spin" />
            Removing
            {@render LoadingDots()}
          {:else}
            Delete {currentDate}
          {/if}
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  {/if}
</Dialog.Root>

<Sheet.Root bind:open={open_edit}>
  <Sheet.Portal>
    <Sheet.Content class="w-full gap-1 md:min-w-[60%]" side="left">
      <Sheet.Header class="border-b">
        <Sheet.Title
          >Edit billing info of {formatDate(parseCalendarDate(row.original.date))}</Sheet.Title
        >
        <Sheet.Description>
          Update the billing info details for billing info with id
          <span class="font-mono text-primary">
            #{row.original.id}
          </span>
        </Sheet.Description>
      </Sheet.Header>
      <ScrollArea class="min-h-0 flex-1">
        <div class="space-y-4 p-4 pb-8">
          <BillingInfoForm
            action="update"
            callback={(valid, _, metaData) => {
              open_edit = false;
              if (valid) {
                billingStore.refresh();
                consumptionStore.refresh();
                showSuccess("Billing info updated successfully!");
              } else {
                showWarning("Failed to update billing info", metaData?.error);
              }
            }}
            billingInfo={billingInfoToDto(row.original)}
          />
        </div>
      </ScrollArea>
    </Sheet.Content>
  </Sheet.Portal>
</Sheet.Root>
