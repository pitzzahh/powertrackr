<script lang="ts">
  import { useModalFooter } from "#lib/components/dynamic-modal.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as FileDropZone from "#lib/components/file-drop-zone/index.js";
  import { Loader, X } from "#lib/assets/icons.js";
  import { showInspectorWarning, showLoading, showSuccess } from "#lib/components/toast/index.js";
  import { importBillingFile } from "#lib/api/import.remote.js";
  import { parseImportItems } from "#lib/validators/import.js";
  import { useBillingStore } from "#lib/stores/billing.svelte.js";
  import { useConsumptionStore } from "#lib/stores/consumption.svelte.js";
  import type { ImportBillingItem } from "#lib/types/import.js";
  import { isHttpError } from "@sveltejs/kit";
  import { toast } from "svelte-sonner";
  import DataPreview from "./data-preview.svelte";
  import ErrorList from "./error-list.svelte";

  const billingStore = useBillingStore();
  const consumptionStore = useConsumptionStore();

  let formEl = $state<HTMLFormElement | null>(null);
  let items = $state<ImportBillingItem[] | null>(null);
  let errors: string[] = $state([]);
  let busy = $state(false);

  const file = $derived(importBillingFile.fields.file.value());
  const subMeterCount = $derived(items?.reduce((n, it) => n + it.subMeters.length, 0) ?? 0);

  async function handleUpload(files: File[]) {
    items = null;
    errors = [];
    const picked = files[0];
    if (!picked) return;
    if (!picked.name.endsWith(".json") && picked.type !== "application/json") {
      errors = ["Please upload a JSON file (.json)"];
      return;
    }
    // FileDropZone clears the native input (so the same file can be re-picked),
    // so the remote form field has to hold the File itself
    importBillingFile.fields.file.set(picked);
    try {
      const parsed = JSON.parse(await picked.text());
      const list = Array.isArray(parsed) ? parsed : parsed?.items;
      if (!Array.isArray(list)) {
        errors = ["JSON must be an array of billing items or an object with an `items` array"];
        return;
      }
      // Strict client-side check with the same schema the server applies
      items = parseImportItems(list);
    } catch (err) {
      errors = [err instanceof Error ? err.message : String(err)];
    }
  }

  function clear() {
    items = null;
    errors = [];
    formEl?.reset();
    // @ts-expect-error the file field accepts no value to clear it
    importBillingFile.fields.file.set(null);
  }

  useModalFooter(actions);
</script>

<div>
  <h2 class="text-lg font-semibold tracking-tight">Import Billing Data</h2>
  <p class="mt-1 text-sm text-muted-foreground">
    Upload a JSON file containing an array of billing items. Each item should follow the billing
    form (fields: <code>date</code>, <code>totalkWh</code>, <code>balance</code>,
    <code>status</code>, <code>subMeters</code>).
  </p>
</div>
<div class="w-full">
  <form
    id="settings-import-form"
    {...importBillingFile.enhance(async ({ submit, element }) => {
      if (!file || !items) {
        showInspectorWarning();
        return;
      }
      if (busy) return;
      busy = true;
      errors = [];
      const toastId = showLoading("Importing data", "Please wait...");
      try {
        await submit();
        const issues = importBillingFile.fields.allIssues() ?? [];
        if (issues.length > 0) {
          errors = issues.map((i) => i.message);
        } else {
          showSuccess("Import successful");
          items = null;
          element.reset();
          billingStore.refresh();
          consumptionStore.refresh();
        }
      } catch (e) {
        errors = [(isHttpError(e) && e.body.message) || "Import failed"];
      } finally {
        toast.dismiss(toastId);
        busy = false;
      }
    })}
    enctype="multipart/form-data"
    bind:this={formEl}
    class="flex w-full flex-col gap-2"
  >
    <input hidden {...importBillingFile.fields.file.as("file")} />
    <div>
      <FileDropZone.Root
        maxFileSize={10 * FileDropZone.MEGABYTE}
        maxFiles={1}
        accept=".json,application/json"
        onUpload={handleUpload}
      >
        <FileDropZone.Trigger />
      </FileDropZone.Root>
    </div>

    <div class="flex place-items-center justify-between gap-2">
      {#if file}
        <div class="flex flex-col">
          <span>{file.name}</span>
          <span class="text-xs text-muted-foreground">{FileDropZone.displaySize(file.size)}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          class="hover:text-destructive"
          aria-label="Remove file"
          onclick={clear}
        >
          <X />
        </Button>
      {/if}
    </div>

    <ErrorList title="Validation errors" {errors} />

    {#if items}
      <DataPreview
        counts={[
          { label: "Billing Infos", value: items.length },
          { label: "Sub-meters", value: subMeterCount },
        ]}
        json={JSON.stringify(items, null, 2)}
      />
    {/if}
  </form>
</div>

{#snippet actions()}
  <div class="flex justify-end gap-2">
    <Button variant="outline" disabled={busy || !file} onclick={clear}>Clear</Button>
    <Button type="submit" form="settings-import-form" disabled={busy || !items} class="min-w-32">
      {#if busy}
        <Loader class="h-4 w-4 animate-spin" />
        Importing…
      {:else}
        Import
      {/if}
    </Button>
  </div>
{/snippet}
