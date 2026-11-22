<script lang="ts" module>
  import type { PendingBilling } from "#lib/types/tenant.js";

  export type PendingReadingFormProps = { pending: PendingBilling };
</script>

<script lang="ts">
  import * as Field from "#lib/components/ui/field/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Loader } from "#lib/assets/icons.js";
  import { fieldInputProps } from "#lib/utils/field.js";
  import { formatDate } from "#lib/utils/format.js";
  import { submitReading } from "#lib/api/tenant.remote.js";
  import { notifyResult } from "#lib/utils/notify.js";

  let { pending }: PendingReadingFormProps = $props();

  // One isolated form per billing: a shared instance can only attach to one <form>
  const form = $derived(submitReading.for("tenant-pending-" + pending.billingInfoId));
  const id = $derived("pending-reading-" + pending.billingInfoId);

  // Starts at the last billed reading; the parent keys this component by billing
  // id, so a query refresh keeps what the tenant typed.
  let reading = $state(initialReading());
  let busy = $state(false);

  function initialReading() {
    return pending.lastBilledReading ?? 0;
  }
</script>

<div class="rounded-lg border p-4">
  <p class="text-sm font-medium">Billing period: {formatDate(pending.date)}</p>
  <p class="text-xs text-muted-foreground">
    Last billed reading: {pending.lastBilledReading ?? "—"}
  </p>
  <form
    {...form.enhance(async ({ submit, fields }) => {
      if (busy) return;
      busy = true;
      await notifyResult({
        run: submit,
        issues: () => fields.allIssues(),
        success: "Reading submitted for this billing",
        failure: "Failed to submit reading",
      });
      busy = false;
    })}
    class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start"
  >
    <input type="hidden" {...form.fields.billingInfoId.as("text")} value={pending.billingInfoId} />
    <Field.Field class="flex-1">
      <Field.Label for={id} class="sr-only">
        Reading for billing period {formatDate(pending.date)}
      </Field.Label>
      <Input
        {id}
        min={pending.lastBilledReading ?? 0}
        step={1}
        required
        aria-describedby="{id}-error"
        {...fieldInputProps(form.fields.reading.as("number"))}
        bind:value={() => String(reading), (v) => (reading = Number(v))}
      />
      <Field.Error id="{id}-error" errors={form.fields.reading.issues()} />
    </Field.Field>
    <Button type="submit" class="w-full justify-center sm:w-auto" disabled={busy}>
      {#if busy}
        <Loader class="size-4 animate-spin" />
        Submitting…
      {:else}
        Submit reading
      {/if}
    </Button>
  </form>
</div>
