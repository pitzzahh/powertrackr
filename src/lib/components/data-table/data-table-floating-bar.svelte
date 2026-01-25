<script module lang="ts">
  import type { HelperResult } from "$/server/types/helper";

  export interface DataTableFloatingBarProps<TData extends object> {
    table: Table<TData>;
    entity_name: string; // singular form of the entity name (e.g., "position", "audit log")
    entity_name_plural?: string; // plural form (e.g., "positions", "audit logs")
    description?: string; // Custom dialog description, optional,
    delete_fn: (row: TData[], count: number | 1) => Promise<HelperResult<TData | number>>; // Custom delete function, optional
    callback?: (valid: boolean) => void; // Optional callback function to call after deletion
  }

  type ComponentState = {
    app_state: "idle" | "processing";
    dialog_open: boolean;
    delete_confirm_value: string;
  };
</script>

<script lang="ts" generics="TData extends object">
  import type { Table } from "@tanstack/table-core";
  import { Separator } from "$/components/ui/separator";
  import * as Tooltip from "$/components/ui/tooltip/index.js";
  import { Trash2, X, RefreshCw } from "$/assets/icons";
  import { scale } from "svelte/transition";
  import { Button, buttonVariants } from "$/components/ui/button/index.js";
  import * as Dialog from "$/components/ui/dialog/index.js";
  import { catchErrorTyped } from "$/utils/error";
  import { cn } from "$/utils/style";
  import { showError, showWarning } from "$/components/toast";
  import { cubicInOut } from "svelte/easing";
  import { Input } from "$/components/ui/input";

  let {
    table,
    entity_name,
    entity_name_plural,
    description: dialogDescription,
    delete_fn,
    callback,
  }: DataTableFloatingBarProps<TData> = $props();

  let { app_state, dialog_open, delete_confirm_value } = $state<ComponentState>({
    app_state: "idle",
    dialog_open: false,
    delete_confirm_value: "",
  });

  const { entity_plural_name, selected_rows, default_dialog_description } = $derived({
    entity_plural_name: entity_name_plural || `${entity_name}s`,
    selected_rows: table.getFilteredSelectedRowModel().rows,
    default_dialog_description: `This action cannot be undone. This will permanently delete the ${table.getFilteredSelectedRowModel().rows.length} selected ${entity_name_plural || `${entity_name}s`}, this is not reversible.`,
  });

  const { deleteMessage } = $derived({
    deleteMessage: `absolutely delete ${selected_rows.length} ${entity_name.toLocaleLowerCase()}`,
  });

  async function handleDeleteSelectedRows() {
    if (delete_confirm_value != deleteMessage) {
      showWarning(
        "Nice try, Inspector!",
        "Bypassing the disabled state won't work. You still need the correct confirmation code."
      );
      return;
    }
    app_state = "processing";
    const total_selected = selected_rows.length;

    const [error, result] = await catchErrorTyped(
      delete_fn(
        selected_rows.flatMap((r) => r.original),
        total_selected
      )
    );

    if (error) {
      showError("Failed to delete, something went wrong", `More info: ${error.message}`);
      return callback?.(false);
    }
    dialog_open = false;
    delete_confirm_value = "";
    app_state = "idle";
    table.toggleAllRowsSelected(false);

    if (!result.valid) {
      if (typeof result.value === "number") {
        if (result.value < selected_rows.length) {
          showWarning(
            "Partial Deletion",
            `${result} ${total_selected === 1 ? entity_name : entity_plural_name} deleted successfully, but some failed.`
          );
        }
      }
      return callback?.(false);
    }
    return callback?.(true);
  }
</script>

<svelte:document
  onkeydown={(e) => {
    if (e.key === "Escape") {
      table.toggleAllRowsSelected(false);
    }
  }}
/>

<div
  transition:scale={{ duration: 100, easing: cubicInOut }}
  class="fixed inset-x-0 bottom-6 z-50 mx-auto w-fit rounded-lg border bg-muted p-3"
>
  <div class="flex gap-2">
    <div class="flex h-10 items-center rounded-md border-2 border-dashed pr-2 pl-4">
      <span class="text-xs whitespace-nowrap">
        {selected_rows.length} selected
      </span>
      <Separator orientation="vertical" class="mr-1 ml-2" />

      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger
            onclick={() => table.toggleAllRowsSelected(false)}
            class={buttonVariants({
              variant: "ghost",
              size: "icon",
              class: "size-5 hover:border",
            })}
          >
            <X class="size-3.5 shrink-0" aria-hidden="true" /></Tooltip.Trigger
          >
          <Tooltip.Content
            class="font-mediun flex items-center border bg-accent px-2 py-1 text-foreground dark:bg-zinc-900"
          >
            <p class="mr-2">Clear selection</p>
            <kbd class={buttonVariants({ variant: "outline", size: "sm" })}>Esc</kbd>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>

    <Button size="icon" variant="hover-text-destructive" onclick={() => (dialog_open = true)}>
      <Trash2 />
    </Button>
  </div>
</div>

<Dialog.Root
  open={dialog_open}
  onOpenChange={(value) => {
    if (!value && app_state === "processing") {
      showWarning("Process Interrupted", "The operation is still processing. Please wait...");
      dialog_open = true;
    } else {
      dialog_open = value;
    }
  }}
>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Are you sure?</Dialog.Title>
      <Dialog.Description>
        {dialogDescription || default_dialog_description}
      </Dialog.Description>
    </Dialog.Header>
    <Input
      bind:value={delete_confirm_value}
      type="text"
      placeholder="Type {deleteMessage} to confirm"
      class="text-center"
    />
    <Dialog.Footer>
      <Button
        variant="outline"
        onclick={() => {
          dialog_open = false;
          delete_confirm_value = "";
        }}
      >
        Cancel
      </Button>
      <Button
        variant="destructive"
        onclick={handleDeleteSelectedRows}
        disabled={delete_confirm_value !== deleteMessage || app_state === "processing"}
      >
        <RefreshCw
          class={cn("hidden h-4 w-4 animate-spin", {
            block: app_state === "processing",
          })}
        />
        <span class={cn("block", { hidden: app_state === "processing" })}>Delete</span>
        <span class={cn("hidden", { block: app_state === "processing" })}>Please Wait</span>
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
