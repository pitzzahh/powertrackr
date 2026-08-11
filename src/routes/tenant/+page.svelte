<script lang="ts">
  import * as Field from "$/components/ui/field";
  import { Button } from "$/components/ui/button";
  import { Input } from "$/components/ui/input";
  import * as Card from "$/components/ui/card";
  import { Loader, Zap, Pencil, InvoiceIcon } from "$/assets/icons";
  import {
    getMyMeter,
    submitReading,
    updateSubmission,
    getPendingBillings,
    getCurrentBilling,
  } from "$/api/tenant.remote";
  import { formatDate, formatEnergy, formatNumber } from "$/utils/format";
  import { showSuccess, showWarning } from "$/components/toast";
  import { isHttpError } from "@sveltejs/kit";
  import { watch } from "runed";

  // Queries drive the page reactively: `.loading`, `.error`, `.current`.
  // Submitting a reading refreshes them server-side (single-flight), so
  // `current` updates without any manual re-fetch.
  const myMeterQuery = getMyMeter({});
  const pendingBillingsQuery = getPendingBillings({});
  const currentBillingQuery = getCurrentBilling({});

  // Isolated remote-form instances: without `for()`, every form sharing
  // `submitReading` would attach to one `<form>` only (the second attach
  // throws) and read/write a shared field/issue state.
  const editSubmissionForm = updateSubmission.for("tenant-edit");

  let readingByBilling = $state<Record<string, number>>({});
  let submittingBilling = $state<Record<string, boolean>>({});
  let editing = $state(false);
  let editReading = $state(0);
  let saving = $state(false);

  // Add input defaults for newly-appeared pending billings (never clobber
  // what the user typed after a refresh).
  watch(
    () => pendingBillingsQuery.current,
    (pendings) => {
      const merged = { ...readingByBilling };
      let changed = false;
      for (const p of pendings ?? []) {
        if (merged[p.billingInfoId] === undefined) {
          merged[p.billingInfoId] = p.lastBilledReading ?? 0;
          changed = true;
        }
      }
      if (changed) {
        readingByBilling = merged;
      }
    }
  );

  function startEdit() {
    editReading = myMeterQuery.current?.latestSubmission?.reading ?? 0;
    editing = true;
  }
</script>

<div class="space-y-6 pb-4">
  <div class="flex items-center justify-between">
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">My Meter</h1>
      <p class="text-muted-foreground">
        Submit your reading when the owner opens a billing period.
      </p>
    </div>
  </div>

  {#if myMeterQuery.error}
    <div class="flex items-center justify-center text-muted-foreground">
      Failed to load your meter
    </div>
  {:else if myMeterQuery.current}
    {@const meter = myMeterQuery.current}
    {@const pendings = pendingBillingsQuery.current ?? []}
    {#if currentBillingQuery.error}
      <div class="flex items-center justify-center text-muted-foreground">
        Failed to load your billing
      </div>
    {:else if currentBillingQuery.current}
      {@const billing = currentBillingQuery.current}
      <Card.Root>
        <Card.Header class="border-b">
          <Card.Title class="flex items-center gap-2 text-sm">
            <InvoiceIcon class="h-4 w-4 text-muted-foreground" />
            Current billing
          </Card.Title>
          <Card.Description class="text-xs">
            Your bill for the period of {formatDate(billing.date)}
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-2 pt-4">
          <div class="flex items-center justify-between rounded-lg border p-4 text-sm">
            <span class="font-medium">Your reading</span>
            <span class="text-muted-foreground">{billing.reading}</span>
          </div>
          <div class="flex items-center justify-between rounded-lg border p-4 text-sm">
            <span class="font-medium">Usage</span>
            <span class="text-muted-foreground">{formatEnergy(billing.usageKwh)}</span>
          </div>
          <div class="flex items-center justify-between rounded-lg border p-4 text-sm">
            <span class="font-medium">Rate</span>
            <span class="text-muted-foreground">{formatNumber(billing.payPerkWh)}/kWh</span>
          </div>
          <div class="flex items-center justify-between rounded-lg border p-4 text-sm">
            <span class="font-medium">Amount due</span>
            <span class="font-semibold text-primary">{formatNumber(billing.amount)}</span>
          </div>
        </Card.Content>
      </Card.Root>
    {/if}

    <Card.Root>
      <Card.Header class="border-b">
        <Card.Title class="flex items-center gap-2 text-sm">
          <Zap class="h-4 w-4 text-muted-foreground" />
          {meter.name}
        </Card.Title>
      </Card.Header>
      <Card.Content class="space-y-6 pt-4">
        <div class="flex items-center justify-between rounded-lg border p-4 text-sm">
          <span class="font-medium">Last billed reading</span>
          <span class="text-muted-foreground">{meter.lastBilledReading ?? "—"}</span>
        </div>

        {#if meter.latestSubmission}
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium">Last submission</h3>
                <p class="text-sm text-muted-foreground">
                  {meter.latestSubmission.reading} ({formatDate(meter.latestSubmission.createdAt)})
                </p>
              </div>
              {#if !editing}
                <Button type="button" variant="outline" size="sm" onclick={startEdit}>
                  <Pencil class="mr-1 size-3.5" />
                  Edit
                </Button>
              {/if}
            </div>

            {#if editing}
              <form
                {...editSubmissionForm.enhance(async ({ submit, fields }) => {
                  if (saving) return;
                  saving = true;
                  try {
                    await submit();
                    const issues = fields.allIssues?.() || [];
                    if (issues.length > 0) {
                      showWarning(issues.map((i) => i.message).join(", "));
                    } else {
                      editing = false;
                      showSuccess("Submission updated");
                    }
                  } catch (e) {
                    const message = isHttpError(e) ? e.body.message : String(e);
                    showWarning(message || "Failed to update submission");
                  } finally {
                    saving = false;
                  }
                })}
                class="space-y-4"
              >
                <Field.Field>
                  <Field.Label for="tenant-reading-edit" class="px-1">Correct Reading</Field.Label>
                  <Input
                    id="tenant-reading-edit"
                    min={meter.lastBilledReading ?? 0}
                    step={1}
                    required
                    {...editSubmissionForm.fields.reading.as("number")}
                    bind:value={editReading}
                  />
                  <Field.Description>
                    Fix a typo or a reading you forgot. Cannot go below your last billed reading ({meter.lastBilledReading ??
                      0}).
                  </Field.Description>
                  <Field.Error errors={editSubmissionForm.fields.reading.issues()} />
                </Field.Field>
                <div class="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onclick={() => (editing = false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {#if saving}
                      <Loader class="size-4 animate-spin" />
                      Saving…
                    {:else}
                      Save
                    {/if}
                  </Button>
                </div>
              </form>
            {/if}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>

    {#if pendings.length > 0}
      <Card.Root>
        <Card.Header class="border-b">
          <Card.Title class="text-sm">Billings awaiting your reading</Card.Title>
          <Card.Description class="text-xs">
            The owner opened these billing periods — submit your reading for each so they can
            finalize the bill.
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4 pt-4">
          {#each pendings as pb (pb.billingInfoId)}
            {@const pendingForm = submitReading.for("tenant-pending-" + pb.billingInfoId)}
            <div class="rounded-lg border p-4">
              <p class="text-sm font-medium">Billing period: {formatDate(pb.date)}</p>
              <p class="text-xs text-muted-foreground">
                Last billed reading: {pb.lastBilledReading ?? "—"}
              </p>
              <form
                {...pendingForm.enhance(async ({ submit, fields }) => {
                  if (submittingBilling[pb.billingInfoId]) return;
                  submittingBilling = { ...submittingBilling, [pb.billingInfoId]: true };
                  try {
                    await submit();
                    const issues = fields.allIssues?.() || [];
                    if (issues.length > 0) {
                      showWarning(issues.map((i) => i.message).join(", "));
                    } else {
                      showSuccess("Reading submitted for this billing");
                    }
                  } catch (e) {
                    const message = isHttpError(e) ? e.body.message : String(e);
                    showWarning(message || "Failed to submit reading");
                  } finally {
                    submittingBilling = { ...submittingBilling, [pb.billingInfoId]: false };
                  }
                })}
                class="mt-3 space-y-3"
              >
                <input
                  type="hidden"
                  {...pendingForm.fields.billingInfoId.as("text")}
                  value={pb.billingInfoId}
                />
                <Field.Field>
                  <Input
                    min={pb.lastBilledReading ?? 0}
                    step={1}
                    required
                    {...pendingForm.fields.reading.as("number")}
                    bind:value={readingByBilling[pb.billingInfoId]}
                  />
                  <Field.Error errors={pendingForm.fields.reading.issues()} />
                </Field.Field>
                <div class="flex justify-end">
                  <Button type="submit" size="sm" disabled={submittingBilling[pb.billingInfoId]}>
                    {#if submittingBilling[pb.billingInfoId]}
                      <Loader class="size-4 animate-spin" />
                      Submitting…
                    {:else}
                      Submit for this billing
                    {/if}
                  </Button>
                </div>
              </form>
            </div>
          {/each}
        </Card.Content>
      </Card.Root>
    {:else}
      <div
        class="flex items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"
      >
        No pending billing requests — you'll see submit options here when the owner opens a billing
        period for you.
      </div>
    {/if}
  {:else}
    <div class="flex items-center justify-center text-muted-foreground">Loading…</div>
  {/if}
</div>
