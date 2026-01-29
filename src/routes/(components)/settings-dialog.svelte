<script lang="ts" module>
  export type SettingsDialogProps = {
    collapsed?: boolean;
  };
  const NAV_DATA = {
    nav: [
      { name: "Import Data", icon: Upload },
      { name: "Export Data", icon: Download },
      { name: "Backup and Restore", icon: DatabaseBackupIcon },
    ],
  } as const;
  type NavName = (typeof NAV_DATA.nav)[number]["name"];
</script>

<script lang="ts">
  import * as Breadcrumb from "$/components/ui/breadcrumb/index.js";
  import { Button } from "$/components/ui/button/index.js";
  import * as Dialog from "$/components/ui/dialog/index.js";
  import * as Sidebar from "$/components/ui/sidebar/index.js";
  import * as Tooltip from "$/components/ui/tooltip/index.js";
  import { Settings2, Upload, Download, DatabaseBackupIcon, X, Loader } from "$/assets/icons";
  import { useBillingStore } from "$/stores/billing.svelte";
  import { useConsumptionStore } from "$/stores/consumption.svelte";
  import * as FileDropZone from "$/components/file-drop-zone/index.js";
  import * as Alert from "$/components/ui/alert/index.js";
  import { importBillingFile } from "$/api/import.remote";
  import { isHttpError } from "@sveltejs/kit";
  import { showInspectorWarning, showSuccess, showError, showLoading } from "$/components/toast";
  import { scale } from "svelte/transition";
  import { onMount, untrack } from "svelte";
  import { cubicInOut } from "svelte/easing";
  import * as v from "valibot";
  import { billFormSchema } from "$/validators/billing-info";
  import { Table, TableBody, TableCell, TableRow } from "$/components/ui/table/index.js";
  import { ScrollArea } from "$/components/ui/scroll-area/index.js";
  import type { BillingCreateForm } from "$/types/billing-info";
  import { toast } from "svelte-sonner";
  let { collapsed = false }: SettingsDialogProps = $props();

  let { open, active_setting } = $state({
    open: false,
    active_setting: (NAV_DATA.nav?.[0]?.name as NavName) ?? "Import Data",
  });

  const billingStore = useBillingStore();
  const consumptionStore = useConsumptionStore();

  let {
    importForm,
    importFile,
    importJson,
    preview,
    validatedItems,
    importErrors,
    importResult,
    isImporting,
    isPreviewing,
    exportJson,
    exportItems,
    exportPreview,
    exportErrors,
    exportResult,
    isExporting,
    runtimeErrors,
  } = $state({
    importForm: null as HTMLFormElement | null,
    importFile: null as File | null,
    importJson: null as any,
    validatedItems: null as any[] | null,
    preview: null as { payments: number; billingInfos: number; subMeters: number } | null,
    importErrors: [] as string[],
    importResult: null as any,
    isImporting: false,
    isPreviewing: false,
    // EXPORT state
    exportJson: null as string | null,
    exportItems: null as any[] | null,
    exportPreview: null as { payments: number; billingInfos: number; subMeters: number } | null,
    exportErrors: [] as string[],
    exportResult: null as any,
    isExporting: false,
    runtimeErrors: [] as string[],
  });

  async function handleUpload(files: File[]) {
    importResult = null;
    importErrors = [];
    preview = null;
    importJson = null;
    importFile = null;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      importErrors = ["Please upload a JSON file (.json)"];
      return;
    }

    // keep local reference for UI
    importFile = file;

    // ensure the remote form field holds the File since the native input is cleared
    // by FileDropZone after selection (so users can re-upload the same file)
    try {
      importBillingFile.fields.file.set(file);
    } catch (e) {
      // ignore if runtime typing differs
    }

    isPreviewing = true;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      importJson = parsed;

      // Determine items (array-form) and validate strictly against schema
      let items: any[] | undefined;
      if (Array.isArray(parsed)) items = parsed;
      else if (parsed && Array.isArray(parsed.items)) items = parsed.items;
      else items = undefined;

      if (!items) {
        importErrors = [
          "JSON must be an array of billing items or an object with an `items` array",
        ];
        importJson = null;
        preview = null;
        validatedItems = null;
      } else {
        try {
          // Strict client-side validation using the shared schema
          const validated = v.parse(v.array(billFormSchema), items);

          // Compute counts for preview
          const payments = validated.reduce(
            (acc, it) =>
              acc + (Array.isArray((it as any).payments) ? (it as any).payments.length : 0),
            0
          );
          const subMeters = validated.reduce(
            (acc, it) =>
              acc + (Array.isArray((it as any).subMeters) ? (it as any).subMeters.length : 0),
            0
          );

          preview = { payments, billingInfos: validated.length, subMeters };
          importErrors = [];
          importResult = null;
          validatedItems = validated;
        } catch (err: any) {
          // Show validation error(s) and prevent submit
          importErrors = [err?.message ?? String(err)];
          importJson = null;
          preview = null;
          validatedItems = null;
        }
      }
    } catch (err: any) {
      importErrors = [err?.message ?? String(err)];
      importJson = null;
      preview = null;
    } finally {
      isPreviewing = false;
    }
  }

  // Import is handled by the remote form `importBillingFile` via the form's enhance handler.

  function clearImport() {
    importFile = null;
    importJson = null;
    validatedItems = null;
    preview = null;
    importErrors = [];
    importResult = null;
    isImporting = false;
    isPreviewing = false;
    if (importForm) importForm.reset();
    // also clear remote form state (cast to any to avoid strict typing around File)
    try {
      importBillingFile.fields.file.set(null as any);
    } catch (e) {}
  }

  /**
   * Export helpers
   */
  async function generateExport() {
    exportErrors = [];
    exportResult = null;
    exportJson = null;
    exportItems = null;
    exportPreview = null;
    isExporting = true;
    try {
      // Ensure latest data loaded (best-effort)
      try {
        if (billingStore.status !== "success") {
          await billingStore.fetchData();
        }
      } catch (e) {
        // ignore - we'll proceed with current store data
      }

      const infos = billingStore.extendedBillingInfos ?? [];
      if (!infos || infos.length === 0) {
        exportErrors = ["No billing data available to export"];
        return;
      }

      // Build "items" array compatible with the existing import schema (billing create form)
      // Defensive per-item mapping (avoid throws on bad/missing data)
      const items: any[] = [];
      const billingInfos: any[] = [];
      const subMeters: any[] = [];
      const paymentsMap = new Map<string, any>();
      const mappingErrors: string[] = [];

      function safeISOString(value: unknown) {
        try {
          if (value === undefined || value === null) return undefined;
          const d = new Date(value as any);
          if (!Number.isFinite(d.getTime())) return undefined;
          return d.toISOString();
        } catch {
          return undefined;
        }
      }

      for (const info of infos) {
        try {
          const dateIso =
            safeISOString(info?.date) ?? safeISOString(info?.createdAt) ?? new Date().toISOString();

          const sms = Array.isArray(info?.subMeters) ? info.subMeters : [];
          const mappedSubMeters = sms.map((s: any) => ({
            label: s?.label ?? "",
            reading: typeof s?.reading === "number" ? s.reading : Number(s?.reading ?? 0),
          }));

          const inlinePayments: any[] = [];
          if (info?.payment && info.payment?.id) {
            const pid = info.payment.id;
            paymentsMap.set(pid, {
              id: pid,
              amount: info.payment.amount ?? null,
              date: safeISOString(info.payment.date),
            });
            inlinePayments.push({
              id: pid,
              amount: info.payment.amount ?? null,
              date: safeISOString(info.payment.date),
            });
          }

          for (const s of sms) {
            if (s?.payment && s.payment?.id) {
              const pid = s.payment.id;
              paymentsMap.set(pid, {
                id: pid,
                amount: s.payment.amount ?? null,
                date: safeISOString(s.payment.date),
              });
              inlinePayments.push({
                id: pid,
                amount: s.payment.amount ?? null,
                date: safeISOString(s.payment.date),
              });
            }
          }

          items.push({
            date: dateIso,
            totalkWh: Number(info?.totalkWh ?? 0),
            balance: Number(info?.balance ?? 0),
            status: info?.status ?? "Pending",
            subMeters: mappedSubMeters,
            ...(inlinePayments.length > 0 ? { payments: inlinePayments } : {}),
          });

          billingInfos.push({
            id: info.id,
            userId: info.userId,
            date: dateIso,
            totalkWh: Number(info.totalkWh ?? 0),
            balance: Number(info.balance ?? 0),
            status: info.status,
            payPerkWh: info.payPerkWh,
            paymentId: info.payment?.id ?? null,
            createdAt: safeISOString(info.createdAt),
            updatedAt: safeISOString(info.updatedAt),
          });

          for (const s of sms) {
            subMeters.push({
              id: s.id,
              billingInfoId: s.billingInfoId ?? info.id,
              subkWh: s.subkWh ?? undefined,
              label: s.label,
              reading: s.reading,
              paymentId: s.payment?.id ?? null,
              createdAt: safeISOString(s.createdAt),
              updatedAt: safeISOString(s.updatedAt),
            });
          }
        } catch (err: any) {
          mappingErrors.push(
            `Failed to map billing info ${String(info?.id ?? "(unknown)")}: ${String(err)}`
          );
        }
      }

      if (items.length === 0 && mappingErrors.length > 0) {
        exportErrors = mappingErrors;
        return;
      }

      const payments = Array.from(paymentsMap.values());
      const payload = {
        items,
        billingInfos,
        subMeters,
        payments,
      };

      exportItems = items;
      exportJson = JSON.stringify(payload, null, 2);
      exportResult = payload;
      exportPreview = {
        billingInfos: billingInfos.length,
        subMeters: subMeters.length,
        payments: payments.length,
      };
    } catch (err: any) {
      exportErrors = [err?.message ?? String(err)];
    } finally {
      isExporting = false;
    }
  }

  function downloadExport() {
    if (!exportJson) {
      exportErrors = ["Nothing to export"];
      return;
    }
    const blob = new Blob([exportJson], { type: "application/json" });
    const filename = `powertrackr-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showSuccess("Export downloaded");
  }

  async function copyExport() {
    if (!exportJson) {
      exportErrors = ["Nothing to copy"];
      return;
    }
    try {
      await navigator.clipboard.writeText(exportJson);
      showSuccess("Copied export to clipboard");
    } catch (err: any) {
      showError("Failed to copy to clipboard", String(err));
    }
  }
</script>

<Dialog.Root bind:open>
  {#if collapsed}
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <Dialog.Trigger {...props}>
              {#snippet child({ props: triggerProps })}
                <Button
                  {...triggerProps}
                  variant="ghost"
                  class="flex w-full items-center justify-center transition-all duration-300 ease-in-out"
                >
                  <Settings2 class="size-6 shrink-0" />
                </Button>
              {/snippet}
            </Dialog.Trigger>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content side="right">
          <p>SETTINGS</p>
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  {:else}
    <Dialog.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          class="flex w-full cursor-pointer items-center justify-start gap-4 no-underline!"
        >
          <Settings2 class="size-6" />
          <span class="text-sm font-medium tracking-wide">SETTINGS</span>
        </Button>
      {/snippet}
    </Dialog.Trigger>
  {/if}
  <Dialog.Content
    class="h-[70vh] overflow-hidden p-0 md:h-[75vh] md:max-w-175 lg:max-w-350"
    trapFocus={false}
  >
    <Dialog.Title class="sr-only">Settings</Dialog.Title>
    <Dialog.Description class="sr-only">Customize your settings here.</Dialog.Description>
    <Sidebar.Provider class="h-full min-h-0 items-start">
      <Sidebar.Root>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupContent>
              <Sidebar.Menu>
                {#each NAV_DATA.nav as item (item.name)}
                  <Sidebar.MenuItem>
                    <Sidebar.MenuButton
                      onclick={() => (active_setting = item.name)}
                      isActive={item.name === active_setting}
                    >
                      {#snippet child({ props })}
                        <a
                          href="##"
                          {...props}
                          onclick={(e) => {
                            e.preventDefault();
                            active_setting = item.name;
                          }}
                        >
                          <item.icon />
                          <span>{item.name}</span>
                        </a>
                      {/snippet}
                    </Sidebar.MenuButton>
                  </Sidebar.MenuItem>
                {/each}
              </Sidebar.Menu>
            </Sidebar.GroupContent>
          </Sidebar.Group>
        </Sidebar.Content>
      </Sidebar.Root>
      <main class="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
        <header
          class="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
        >
          <div class="flex items-center gap-2 px-4">
            <Breadcrumb.Root>
              <Breadcrumb.List>
                <Breadcrumb.Item class="hidden md:block">
                  <Breadcrumb.Link href="##">Settings</Breadcrumb.Link>
                </Breadcrumb.Item>
                <Breadcrumb.Separator class="hidden md:block" />
                <Breadcrumb.Item>
                  <Breadcrumb.Page>{active_setting}</Breadcrumb.Page>
                </Breadcrumb.Item>
              </Breadcrumb.List>
            </Breadcrumb.Root>
          </div>
        </header>
        <ScrollArea class="h-72 flex-1 rounded-md">
          <div class="flex min-h-0 flex-1 flex-col gap-4 p-4 pt-0">
            <div class="flex flex-1 flex-col gap-4">
              {#if active_setting === "Import Data"}
                {@render Import()}
              {:else if active_setting === "Export Data"}
                {@render Export()}
              {/if}
            </div>
          </div>
        </ScrollArea>
      </main>
    </Sidebar.Provider>
  </Dialog.Content>
</Dialog.Root>

{#snippet Import()}
  {@const file = importBillingFile.fields.file.value()}
  <div>
    <h2 class="text-lg font-medium">Import Billing Data</h2>
    <p class="text-sm text-muted-foreground">
      Upload a JSON file containing an array of billing items. Each item should follow the billing
      form (fields: <code>date</code>, <code>totalkWh</code>, <code>balance</code>,
      <code>status</code>,
      <code>subMeters</code>).
    </p>
  </div>
  <div class="w-full rounded-xl bg-muted/50 p-4">
    <form
      {...importBillingFile.enhance(
        async ({
          submit,
          form,
        }: {
          submit: (...args: any[]) => Promise<any>;
          form: HTMLFormElement;
        }) => {
          if (!file) {
            showInspectorWarning();
            return;
          }
          if (isImporting) return;
          const toastId = showLoading("Importing data", "Please wait...");
          isImporting = true;
          importErrors = [];
          importResult = null;
          try {
            if (!validatedItems) {
              toast.dismiss(toastId);
              importErrors = ["No valid data to import (fix validation errors)"];
              return;
            }
            const res = await submit();
            toast.dismiss(toastId);
            // Try to extract returned value if available (shape may vary)
            if (res && typeof res === "object" && "value" in res) {
              importResult = (res as any).value;
            } else {
              importResult = res;
            }
            const issues = importBillingFile.fields?.allIssues?.() || [];
            if (issues.length > 0) {
              importErrors = issues.map((i: any) => i.message);
            } else {
              showSuccess("Import successful");
              preview = null;
              importJson = null;
              importFile = null;
              form.reset();
              billingStore.refresh();
              consumptionStore.refresh();
            }
          } catch (e) {
            const message = isHttpError(e) ? e.body.message : String(e);
            importErrors = [message || "Import failed"];
          } finally {
            toast.dismiss(toastId);
            isImporting = false;
          }
        }
      )}
      enctype="multipart/form-data"
      bind:this={importForm}
      class="flex w-full flex-col gap-2"
    >
      <input hidden {...importBillingFile.fields.file.as("file")} />
      <div in:scale={{ duration: 350, easing: cubicInOut, start: 0.8 }}>
        <FileDropZone.Root
          maxFileSize={10 * FileDropZone.MEGABYTE}
          maxFiles={1}
          accept=".json,application/json"
          onUpload={handleUpload}
        >
          <FileDropZone.Trigger />
        </FileDropZone.Root>
      </div>

      <!-- preview moved below submit button -->

      <div
        in:scale={{ duration: 350, easing: cubicInOut, start: 0.8, delay: 100 }}
        class="flex place-items-center justify-between gap-2"
      >
        {#if file}
          <div class="flex flex-col">
            <span>{file.name}</span>
            <span class="text-xs text-muted-foreground">{FileDropZone.displaySize(file.size)}</span>
          </div>
          <Button variant="hover-text-destructive" size="icon" onclick={() => clearImport()}>
            <X />
          </Button>
        {/if}
      </div>
      <div in:scale={{ duration: 350, easing: cubicInOut, start: 0.8, delay: 200 }}>
        <Button type="submit" disabled={isImporting || !validatedItems} class="w-full">
          {#if isImporting}
            <Loader class="h-4 w-4 animate-spin" />
            Importing…
          {:else}
            Submit
          {/if}
        </Button>
      </div>

      {#if importErrors?.length}
        <Alert.Root variant="destructive" class="mt-4">
          <Alert.Title>Validation errors</Alert.Title>
          <Alert.Description>
            {#each importErrors as err}
              <div>{err}</div>
            {/each}
          </Alert.Description>
        </Alert.Root>
      {/if}

      {#if validatedItems}
        <div class="mt-4 space-y-4">
          <Table class="max-w-full rounded-md border bg-background">
            <TableBody>
              <TableRow class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell class="min-w-0 bg-muted/50 py-2 font-medium">Billing Infos</TableCell>
                <TableCell class="min-w-0 py-2">{preview?.billingInfos ?? 0}</TableCell>
              </TableRow>
              <TableRow class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableCell class="min-w-0 bg-muted/50 py-2 font-medium">Sub-meters</TableCell>
                <TableCell class="min-w-0 py-2">{preview?.subMeters ?? 0}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <ScrollArea class="h-72 rounded-md border bg-muted/10">
            <div class="p-4">
              <pre class="text-xs whitespace-pre-wrap">{JSON.stringify(
                  validatedItems,
                  null,
                  2
                )}</pre>
            </div>
          </ScrollArea>
        </div>
      {/if}
    </form>
  </div>
{/snippet}

{#snippet Export()}
  <div>
    <h2 class="text-lg font-medium">Export Data</h2>
    <p class="text-sm text-muted-foreground">
      Export data from the system to a downloadable file. The exported file contains an <code
        >items</code
      >
      array (compatible with the import flow) and full backup arrays (<code>billingInfos</code>,
      <code>subMeters</code>, <code>payments</code>).
    </p>
  </div>

  <div class="w-full rounded-xl bg-muted/50 p-4">
    <div class="flex items-center justify-between gap-2">
      <div class="flex flex-col">
        <div class="mt-2 flex items-center gap-2">
          <Button onclick={() => generateExport()} disabled={isExporting}>
            {#if isExporting}
              <Loader class="mr-2 h-4 w-4 animate-spin" />
              Generating…
            {:else}
              Generate
            {/if}
          </Button>
          <Button
            onclick={() => downloadExport()}
            variant="outline"
            disabled={!exportJson}
            title="Download JSON"
          >
            <Download />
            Download
          </Button>
          <Button
            onclick={() => copyExport()}
            variant="ghost"
            disabled={!exportJson}
            title="Copy JSON to clipboard"
          >
            Copy
          </Button>
        </div>
      </div>
    </div>

    {#if exportErrors?.length}
      <Alert.Root variant="destructive" class="mt-4">
        <Alert.Title>Export errors</Alert.Title>
        <Alert.Description>
          {#each exportErrors as err}
            <div>{err}</div>
          {/each}
        </Alert.Description>
      </Alert.Root>
    {/if}

    {#if exportItems}
      <div class="mt-4 space-y-4">
        <Table class="max-w-full rounded-md border bg-background">
          <TableBody>
            <TableRow class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
              <TableCell class="min-w-0 bg-muted/50 py-2 font-medium">Billing Infos</TableCell>
              <TableCell class="min-w-0 py-2"
                >{exportPreview?.billingInfos ?? exportItems.length}</TableCell
              >
            </TableRow>
            <TableRow class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
              <TableCell class="min-w-0 bg-muted/50 py-2 font-medium">Sub-meters</TableCell>
              <TableCell class="min-w-0 py-2">{exportPreview?.subMeters ?? 0}</TableCell>
            </TableRow>
            <TableRow class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
              <TableCell class="min-w-0 bg-muted/50 py-2 font-medium">Payments</TableCell>
              <TableCell class="min-w-0 py-2">{exportPreview?.payments ?? 0}</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <ScrollArea class="h-72 rounded-md border bg-muted/10">
          <div class="p-4">
            <pre class="text-xs whitespace-pre-wrap">{exportJson}</pre>
          </div>
        </ScrollArea>
      </div>
    {/if}

    {#if !exportItems && !exportErrors?.length}
      <div class="mt-4 text-sm text-muted-foreground">No data available to export.</div>
    {/if}
  </div>
{/snippet}
