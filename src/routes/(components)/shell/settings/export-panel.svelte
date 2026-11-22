<script lang="ts">
  import { useModalFooter } from "#lib/components/dynamic-modal.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Download, Loader } from "#lib/assets/icons.js";
  import { showError, showSuccess } from "#lib/components/toast/index.js";
  import { useBillingStore } from "#lib/stores/billing.svelte.js";
  import { buildExport } from "./build-export.js";
  import type { ExportPreview } from "#lib/types/import.js";
  import DataPreview from "./data-preview.svelte";
  import ErrorList from "./error-list.svelte";

  const billingStore = useBillingStore();

  let json = $state<string | null>(null);
  let preview = $state<ExportPreview | null>(null);
  let errors: string[] = $state([]);
  let busy = $state(false);

  async function generate() {
    errors = [];
    json = null;
    preview = null;
    busy = true;
    try {
      // Best effort: export whatever is loaded if the refresh fails
      if (billingStore.status !== "success") await billingStore.fetchData().catch(() => {});
      const infos = billingStore.extendedBillingInfos ?? [];
      if (infos.length === 0) {
        errors = ["No billing data available to export"];
        return;
      }
      const result = buildExport(infos);
      json = JSON.stringify(result.payload, null, 2);
      preview = result.preview;
    } catch (err) {
      errors = [err instanceof Error ? err.message : String(err)];
    } finally {
      busy = false;
    }
  }

  function download() {
    if (!json) return;
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `powertrackr-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showSuccess("Export downloaded");
  }

  async function copy() {
    if (!json) return;
    try {
      await navigator.clipboard.writeText(json);
      showSuccess("Copied export to clipboard");
    } catch (err) {
      showError("Failed to copy to clipboard", String(err));
    }
  }

  useModalFooter(actions);
</script>

<div>
  <h2 class="text-lg font-semibold tracking-tight">Export Data</h2>
  <p class="mt-1 text-sm text-muted-foreground">
    Export data from the system to a downloadable file. The exported file contains an
    <code>items</code> array (compatible with the import flow) and full backup arrays (<code>
      billingInfos
    </code>, <code>subMeters</code>, <code>payments</code>).
  </p>
</div>

<div class="w-full">
  <ErrorList title="Export errors" {errors} />

  {#if json && preview}
    <DataPreview
      counts={[
        { label: "Billing Infos", value: preview.billingInfos },
        { label: "Sub-meters", value: preview.subMeters },
        { label: "Payments", value: preview.payments },
      ]}
      {json}
    />
  {:else if !errors.length}
    <div class="mt-4 text-sm text-muted-foreground">No data available to export.</div>
  {/if}
</div>

{#snippet actions()}
  <div class="flex flex-wrap justify-end gap-2">
    <Button onclick={copy} variant="ghost" disabled={!json} title="Copy JSON to clipboard">
      Copy
    </Button>
    <Button onclick={download} variant="outline" disabled={!json} title="Download JSON">
      <Download />
      Download
    </Button>
    <Button onclick={generate} disabled={busy} class="min-w-28">
      {#if busy}
        <Loader class="h-4 w-4 animate-spin" />
        Generating…
      {:else}
        Generate
      {/if}
    </Button>
  </div>
{/snippet}
