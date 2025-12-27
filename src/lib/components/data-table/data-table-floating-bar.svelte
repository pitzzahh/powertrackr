<script module lang="ts">
  export interface DataTableFloatingBarProps<TData extends object> {
    table: Table<TData>;
    entity_name: string; // singular form of the entity name (e.g., "position", "audit log")
    entity_name_plural?: string; // plural form (e.g., "positions", "audit logs")
    description?: string; // Custom dialog description, optional,
    delete_fn: (row: TData) => Promise<0 | 1>; // Custom delete function, optional
    callback?: (valid: boolean) => void; // Optional callback function to call after deletion
  }

  type ComponentState = {
    app_state: "idle" | "processing";
    dialog_open: boolean;
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
  import { toast } from "svelte-sonner";
  import { cn } from "$/utils/style";
  import { Toast } from "$/components/toast";
  import { cubicInOut } from "svelte/easing";

  let {
    table,
    entity_name,
    entity_name_plural,
    description: dialogDescription,
    delete_fn,
    callback,
  }: DataTableFloatingBarProps<TData> = $props();

  let { app_state, dialog_open } = $state<ComponentState>({
    app_state: "idle",
    dialog_open: false,
  });

  const { entity_plural_name, selected_rows, default_dialog_description } =
    $derived({
      entity_plural_name: entity_name_plural || `${entity_name}s`,
      selected_rows: table.getFilteredSelectedRowModel().rows,
      default_dialog_description: `This action cannot be undone. This will permanently delete the ${table.getFilteredSelectedRowModel().rows.length} selected ${entity_name_plural || `${entity_name}s`}, this is not reversible.`,
    });

  async function handleDeleteSelectedRows() {
    app_state = "processing";
    const total_selected = selected_rows.length;
    let valid_count = 0;
    let error_count = 0;

    for (const row of selected_rows) {
      if (delete_fn) {
        const [error, result] = await catchErrorTyped(delete_fn(row.original));
        console.debug(
          `Delete function called for row: ${JSON.stringify(row.original)}, result: ${result}, error: ${error}`,
        );
        if (error) {
          error_count++;
        } else if (result === 1) {
          valid_count++;
        }
        continue;
      }
    }
    dialog_open = false;
    app_state = "idle";
    table.toggleAllRowsSelected(false);
    if (valid_count < selected_rows.length) {
      toast.custom(Toast, {
        componentProps: {
          title: "Partial Deletion",
          description: `${valid_count} ${total_selected === 1 ? entity_name : entity_plural_name} deleted successfully, but some failed.`,
          variant: "warning",
        },
      });
      return callback?.(false);
    } else if (error_count > 0) {
      toast.custom(Toast, {
        componentProps: {
          title: "Deletion Failed",
          description: `Failed to delete selected ${entity_plural_name}. Please try again.`,
          variant: "destructive",
        },
      });
      return callback?.(false);
    } else {
      return callback?.(valid_count === total_selected);
    }
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
    <div
      class="flex h-10 items-center rounded-md border-2 border-dashed pl-4 pr-2"
    >
      <span class="whitespace-nowrap text-xs">
        {selected_rows.length} selected
      </span>
      <Separator orientation="vertical" class="ml-2 mr-1" />

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
            <kbd class={buttonVariants({ variant: "outline", size: "sm" })}
              >Esc</kbd
            >
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>

    <Button
      size="icon"
      variant="hover-text-destructive"
      onclick={() => (dialog_open = true)}
    >
      <Trash2 />
    </Button>
  </div>
</div>

<Dialog.Root open={dialog_open} onOpenChange={(value) => (dialog_open = value)}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Are you sure?</Dialog.Title>
      <Dialog.Description>
        {dialogDescription || default_dialog_description}
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (dialog_open = false)}
        >Cancel</Button
      >
      <Button variant="destructive" onclick={handleDeleteSelectedRows}>
        <RefreshCw
          class={cn("hidden h-4 w-4 animate-spin", {
            block: app_state === "processing",
          })}
        />
        <span class={cn("block", { hidden: app_state === "processing" })}
          >Delete</span
        >
        <span class={cn("hidden", { block: app_state === "processing" })}
          >Please Wait</span
        >
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
