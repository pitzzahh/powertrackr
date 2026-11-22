<script lang="ts" module>
  import type { MyMeter } from "#lib/types/tenant.js";

  export type MyMeterCardProps = { meter: MyMeter };
</script>

<script lang="ts">
  import * as Card from "#lib/components/ui/card/index.js";
  import * as Field from "#lib/components/ui/field/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Loader, Pencil, Zap } from "#lib/assets/icons.js";
  import { fieldInputProps } from "#lib/utils/field.js";
  import { formatDate } from "#lib/utils/format.js";
  import { updateSubmission } from "#lib/api/tenant.remote.js";
  import { notifyResult } from "#lib/utils/notify.js";
  import StatRow from "./stat-row.svelte";

  let { meter }: MyMeterCardProps = $props();

  // Isolated instance: other forms on the page use their own `for()` keys
  const form = updateSubmission.for("tenant-edit");

  let editing = $state(false);
  let editReading = $state(0);
  let saving = $state(false);

  function startEdit() {
    editReading = meter.latestSubmission?.reading ?? 0;
    editing = true;
  }
</script>

<Card.Root class="h-full">
  <Card.Header class="border-b">
    <h2 class="flex items-center gap-2 text-sm leading-none font-semibold tracking-tight">
      <Zap class="h-4 w-4 text-muted-foreground" />
      {meter.name}
    </h2>
  </Card.Header>
  <Card.Content class="space-y-6">
    <StatRow label="Last billed reading" value={meter.lastBilledReading ?? "—"} />

    {#if meter.latestSubmission}
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <h3 class="text-sm font-medium">Last submission</h3>
            <p class="text-sm text-muted-foreground">
              {meter.latestSubmission.reading} ({formatDate(meter.latestSubmission.createdAt)})
            </p>
          </div>
          {#if !editing}
            <Button type="button" variant="outline" size="sm" onclick={startEdit}>
              <Pencil class="size-3.5" />
              Edit
            </Button>
          {/if}
        </div>

        {#if editing}
          <form
            {...form.enhance(async ({ submit, fields }) => {
              if (saving) return;
              saving = true;
              if (
                await notifyResult({
                  run: submit,
                  issues: () => fields.allIssues(),
                  success: "Submission updated",
                  failure: "Failed to update submission",
                })
              ) {
                editing = false;
              }
              saving = false;
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
                aria-describedby="tenant-reading-edit-help tenant-reading-edit-error"
                {...fieldInputProps(form.fields.reading.as("number"))}
                bind:value={() => String(editReading), (v) => (editReading = Number(v))}
              />
              <Field.Description id="tenant-reading-edit-help">
                Fix a typo or a reading you forgot. Cannot go below your last billed reading ({meter.lastBilledReading ??
                  0}).
              </Field.Description>
              <Field.Error id="tenant-reading-edit-error" errors={form.fields.reading.issues()} />
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
