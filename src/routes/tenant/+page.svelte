<script lang="ts">
  import { onMount } from "svelte";
  import * as Field from "$/components/ui/field";
  import { Button } from "$/components/ui/button";
  import { Input } from "$/components/ui/input";
  import * as Card from "$/components/ui/card";
  import { Loader, Zap, Pencil } from "$/assets/icons";
  import {
    getMyMeter,
    submitReading,
    updateSubmission,
    getPendingBillings,
  } from "$/api/tenant.remote";
  import type { MyMeter, PendingBilling } from "$/types/tenant";
  import { formatDate } from "$/utils/format";
  import { showSuccess, showWarning } from "$/components/toast";
  import { isHttpError } from "@sveltejs/kit";
  import type { AsyncState } from "$/types/state";

  let meter = $state<MyMeter | null>(null);
  let pendingBillings = $state<PendingBilling[]>([]);
  let status = $state<AsyncState>("idle");
  let reading = $state(0);
  let submitting = $state(false);
  let readingByBilling = $state<Record<string, number>>({});
  let submittingBilling = $state<Record<string, boolean>>({});
  let editing = $state(false);
  let editReading = $state(0);
  let saving = $state(false);

  async function refresh() {
    try {
      const [meterResult, pendingResult] = await Promise.all([
        getMyMeter({}),
        getPendingBillings({}),
      ]);
      meter = meterResult as MyMeter;
      pendingBillings = (pendingResult as PendingBilling[]) ?? [];
      reading = meter?.latestSubmission?.reading ?? meter?.lastBilledReading ?? 0;
      editReading = meter?.latestSubmission?.reading ?? 0;
      const defaults: Record<string, number> = {};
      for (const p of pendingBillings) {
        defaults[p.billingInfoId] = p.lastBilledReading ?? 0;
      }
      readingByBilling = defaults;
      status = "success";
    } catch (err) {
      console.error(err);
      status = "error";
    }
  }

  onMount(() => {
    status = "loading_data";
    refresh();
  });

  function startEdit() {
    editReading = meter?.latestSubmission?.reading ?? 0;
    editing = true;
  }
</script>

<div class="space-y-6 pb-4">
  <div class="flex items-center justify-between">
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">My Meter</h1>
      <p class="text-muted-foreground">Submit your current meter reading.</p>
    </div>
  </div>

  {#if status === "loading_data"}
    <div class="flex items-center justify-center text-muted-foreground">Loading…</div>
  {:else if status === "error"}
    <div class="flex items-center justify-center text-muted-foreground">
      Failed to load your meter
    </div>
  {:else if meter}
    <Card.Root>
      <Card.Header class="border-b">
        <Card.Title class="flex items-center gap-2 text-sm">
          <Zap class="h-4 w-4 text-muted-foreground" />
          {meter.name}
        </Card.Title>
      </Card.Header>
      <Card.Content class="space-y-6 pt-4">
        <form
          {...submitReading.enhance(async ({ submit }) => {
            if (submitting) return;
            submitting = true;
            try {
              await submit();
              const issues = submitReading.fields.allIssues?.() || [];
              if (issues.length > 0) {
                showWarning(issues.map((i) => i.message).join(", "));
              } else {
                showSuccess("Reading submitted");
                await refresh();
              }
            } catch (e) {
              const message = isHttpError(e) ? e.body.message : String(e);
              showWarning(message || "Failed to submit reading");
            } finally {
              submitting = false;
            }
          })}
          class="space-y-4"
        >
          <Field.Field>
            <Field.Label for="tenant-reading" class="px-1">Submit New Reading</Field.Label>
            <Input
              id="tenant-reading"
              min={meter.lastBilledReading ?? 0}
              step={1}
              required
              {...submitReading.fields.reading.as("number")}
              bind:value={reading}
            />
            <Field.Description>
              Last billed reading: {meter.lastBilledReading ?? "—"}
              {#if meter.latestSubmission}
                · Latest submission: {meter.latestSubmission.reading} (
                {formatDate(meter.latestSubmission.createdAt)})
              {/if}
            </Field.Description>
            <Field.Error errors={submitReading.fields.reading.issues()} />
          </Field.Field>
          <div class="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {#if submitting}
                <Loader class="size-5 animate-spin" />
                Submitting…
              {:else}
                Submit Reading
              {/if}
            </Button>
          </div>
        </form>

        {#if meter.latestSubmission}
          <div class="space-y-4 border-t pt-6">
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
                {...updateSubmission.enhance(async ({ submit }) => {
                  if (saving) return;
                  saving = true;
                  try {
                    await submit();
                    const issues = updateSubmission.fields.allIssues?.() || [];
                    if (issues.length > 0) {
                      showWarning(issues.map((i) => i.message).join(", "));
                    } else {
                      editing = false;
                      showSuccess("Submission updated");
                      await refresh();
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
                    {...updateSubmission.fields.reading.as("number")}
                    bind:value={editReading}
                  />
                  <Field.Description>
                    Fix a typo or a reading you forgot. Cannot go below your last billed reading ({meter.lastBilledReading ??
                      0}).
                  </Field.Description>
                  <Field.Error errors={updateSubmission.fields.reading.issues()} />
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

    {#if pendingBillings.length > 0}
      <Card.Root>
        <Card.Header class="border-b">
          <Card.Title class="text-sm">Billings awaiting your reading</Card.Title>
          <Card.Description class="text-xs">
            The owner opened these billing periods — submit your reading for each so they can
            finalize the bill.
          </Card.Description>
        </Card.Header>
        <Card.Content class="space-y-4 pt-4">
          {#each pendingBillings as pb (pb.billingInfoId)}
            <div class="rounded-lg border p-4">
              <p class="text-sm font-medium">Billing period: {formatDate(pb.date)}</p>
              <p class="text-xs text-muted-foreground">
                Last billed reading: {pb.lastBilledReading ?? "—"}
              </p>
              <form
                {...submitReading.enhance(async ({ submit }) => {
                  if (submittingBilling[pb.billingInfoId]) return;
                  submittingBilling = { ...submittingBilling, [pb.billingInfoId]: true };
                  try {
                    await submit();
                    const issues = submitReading.fields.allIssues?.() || [];
                    if (issues.length > 0) {
                      showWarning(issues.map((i) => i.message).join(", "));
                    } else {
                      showSuccess("Reading submitted for this billing");
                      await refresh();
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
                  {...submitReading.fields.billingInfoId.as("text")}
                  value={pb.billingInfoId}
                />
                <Field.Field>
                  <Input
                    min={pb.lastBilledReading ?? 0}
                    step={1}
                    required
                    {...submitReading.fields.reading.as("number")}
                    bind:value={readingByBilling[pb.billingInfoId]}
                  />
                  <Field.Error errors={submitReading.fields.reading.issues()} />
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
    {/if}
  {/if}
</div>
