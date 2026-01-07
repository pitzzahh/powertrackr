<script module lang="ts">
  export interface BillingInfoDataTableRowActionsProps {
    row: Row<ExtendedBillingInfoTableView>;
  }
  interface ComponentState {
    app_state: "stale" | "processing";
    active_dialog_content: "view" | "remove";
    open_view: boolean;
    open_edit: boolean;
  }
</script>

<script lang="ts">
  import {
    Loader,
    PhilippinePeso,
    Trash2,
    View,
    Pencil,
    Ticket,
    CreditCard,
    User,
    Clock,
    Hash,
    CheckCircle,
    Zap,
  } from "$/assets/icons";

  import { formatDate } from "$/utils/format";
  import type { Row } from "@tanstack/table-core";
  import Button from "$/components/ui/button/button.svelte";
  import * as Dialog from "$/components/ui/dialog";
  import { showSuccess, showWarning, Toast } from "$/components/toast";
  import * as Sheet from "$/components/ui/sheet/index.js";
  import { ScrollArea } from "$/components/ui/scroll-area";
  import BillingInfoForm from "./billing-info-form.svelte";
  import type { ExtendedBillingInfoTableView } from "$/types/billing-info";
  import { billingInfoToDto } from "$/utils/mapper/billing-info";

  let { row }: BillingInfoDataTableRowActionsProps = $props();

  let { app_state, active_dialog_content, open_view, open_edit } =
    $state<ComponentState>({
      app_state: "stale",
      active_dialog_content: "view",
      open_view: false,
      open_edit: false,
    });

  async function handle_remove_billing_info() {
    app_state = "processing";
    // const delete_result = await deleteBillingInfo(row.original.id);
    // open_view = false;
    // app_state = "stale";
    // if (delete_result === 0) {
    //   return toast.custom(Toast, {
    //     componentProps: {
    //       title: "Failed to Remove Billing Info",
    //       description:
    //         "Failed to remove billing info record. It may not exist or already removed.",
    //       variant: "destructive",
    //     },
    //   });
    // }
    return showSuccess(
      "Successfully Removed Billing Info",
      "Billing Info record has been successfully removed.",
    )
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
      showWarning(
        "Process Interrupted",
        "The operation is still processing. Please wait...",
      )
      open_view = true;
    }
  }}
>
  {#if active_dialog_content === "view"}
    <Dialog.Content class="md:max-h-132.5 md:max-w-237.5 lg:max-w-250">
      <Dialog.Header>
        <Dialog.Title class="text-3xl font-bold flex items-center gap-2">
          <Ticket class="size-6" />
          Billing Info Details
        </Dialog.Title>
        <Dialog.Description class="text-lg text-muted-foreground mt-2">
          Comprehensive billing information for
          <span class="font-mono text-primary"
            >{formatDate(new Date(row.original.date))}</span
          >
        </Dialog.Description>
      </Dialog.Header>
      <div class="p-4 h-72 overflow-y-auto">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left Column -->
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <span
                class="font-semibold text-muted-foreground flex items-center gap-1"
              >
                <Hash class="size-4" />
                ID:
              </span>
              <span class="font-mono text-primary">{row.original.id}</span>
            </div>

            <div class="flex items-center gap-2">
              <span
                class="font-semibold text-muted-foreground flex items-center gap-1"
              >
                <User class="size-4" />
                User ID:
              </span>
              <span class="font-mono">{row.original.userId}</span>
            </div>

            <div class="flex items-center gap-2">
              <span
                class="font-semibold text-muted-foreground flex items-center gap-1"
              >
                <Clock class="size-4" />
                Date:
              </span>
              <span class="font-mono"
                >{formatDate(new Date(row.original.date))}</span
              >
            </div>

            <div class="flex items-center gap-2">
              <span
                class="font-semibold text-muted-foreground flex items-center gap-1"
              >
                <Zap class="size-4" />
                Total KWh:
              </span>
              <span class="font-semibold">{row.original.totalKWh}</span>
            </div>



            <div class="flex items-center gap-2">
              <span
                class="font-semibold text-muted-foreground flex items-center gap-1"
              >
                <PhilippinePeso class="size-4" />
                Balance:
              </span>
              <span class="font-bold text-lg text-green-700"
                >₱{row.original.balance.toFixed(2)}</span
              >
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <span
                class="font-semibold text-muted-foreground flex items-center gap-1"
              >
                <CheckCircle class="size-4" />
                Status:
              </span>
              <span
                class="font-semibold"
                class:text-green-700={row.original.status === "Paid"}
                class:text-red-700={row.original.status !== "Paid"}
              >
                {row.original.status}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <span
                class="font-semibold text-muted-foreground flex items-center gap-1"
              >
                <PhilippinePeso class="size-4" />
                Pay Per KWh:
              </span>
              <span class="font-semibold"
                >₱{row.original.payPerKwh.toFixed(2)}</span
              >
            </div>





            {#if row.original.paymentId}
              <div class="flex items-center gap-2">
                <span
                  class="font-semibold text-muted-foreground flex items-center gap-1"
                >
                  <CreditCard class="size-4" />
                  Payment ID:
                </span>
                <span class="font-mono">{row.original.paymentId}</span>
              </div>
            {/if}


          </div>
        </div>
      </div>
    </Dialog.Content>
  {/if}

  {#if active_dialog_content === "remove"}
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Remove Billing Info Record</Dialog.Title>
        <Dialog.Description>
          Are you sure you want to remove this billing info record? This action
          cannot be undone.
        </Dialog.Description>
      </Dialog.Header>
      <Dialog.Footer>
        <Button
          variant="secondary"
          onclick={() => {
            open_view = false;
          }}
        >
          Cancel
        </Button>
        {@const currentDate = formatDate(new Date(row.original.date))}
        <Button
          variant="destructive"
          onclick={handle_remove_billing_info}
          disabled={app_state === "processing"}
          title="Confirm Delete Billing Info {currentDate}"
        >
          {#if app_state === "processing"}
            <Loader class="size-4 mr-2 animate-spin" />
            Removing
            <span class="ml-1">
              <span class="animate-pulse animation-delay-0">.</span>
              <span class="animate-pulse animation-delay-500">.</span>
              <span class="animate-pulse animation-delay-1000">.</span>
            </span>
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
    <Sheet.Content class="min-w-[60%]" side="left">
      <Sheet.Header>
        <Sheet.Title
          >Edit billing info of {formatDate(
            new Date(row.original.date),
          )}</Sheet.Title
        >
        <Sheet.Description>
          Update the billing info details for billing info with id
          <span class="font-mono text-primary">
            #{row.original.id}
          </span>
        </Sheet.Description>
      </Sheet.Header>

      <ScrollArea class="overflow-y-auto h-[calc(100vh-50px)] pr-2.5">
        <div class="space-y-4 p-4">
          <BillingInfoForm
            action="update"
            billingInfo={billingInfoToDto({
                ...row.original,
                date: row.original.date,
                createdAt: row.original.createdAt ? new Date(row.original.createdAt) : null,
                updatedAt: row.original.updatedAt ? new Date(row.original.updatedAt) : null,
              })}
          />
        </div>
      </ScrollArea>
    </Sheet.Content>
  </Sheet.Portal>
</Sheet.Root>
