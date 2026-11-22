<script lang="ts" module>
  import type { TenantWithMeters } from "#lib/types/tenant.js";

  export type TenantCardProps = {
    tenant: TenantWithMeters;
    onedit: () => void;
    ondelete: () => void;
  };
</script>

<script lang="ts">
  import * as Card from "#lib/components/ui/card/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Pencil, Trash2 } from "#lib/assets/icons.js";
  import { formatDate } from "#lib/utils/format.js";

  let { tenant, onedit, ondelete }: TenantCardProps = $props();

  const stats = $derived([
    { label: "Last billed reading", value: tenant.lastBilledReading ?? "—" },
    {
      label: "Latest submission",
      value: tenant.latestSubmission
        ? `${tenant.latestSubmission.reading} (${formatDate(tenant.latestSubmission.createdAt)})`
        : "No submission yet",
    },
  ]);
</script>

<Card.Root class="h-full">
  <Card.Header class="border-b">
    <div class="flex min-w-0 items-center justify-between gap-3">
      <div class="min-w-0 space-y-0.5">
        <h2 class="truncate text-sm leading-none font-semibold tracking-tight">{tenant.name}</h2>
        <Card.Description class="truncate text-xs">{tenant.email}</Card.Description>
      </div>
      <div class="flex shrink-0 gap-2">
        <Button type="button" variant="outline" size="sm" onclick={onedit} aria-haspopup="dialog">
          <Pencil class="size-3.5" />
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          class="text-destructive hover:text-destructive"
          aria-label="Delete {tenant.name}"
          title="Delete {tenant.name}"
          onclick={ondelete}
          aria-haspopup="dialog"
        >
          <Trash2 class="size-4" />
        </Button>
      </div>
    </div>
  </Card.Header>
  <Card.Content>
    <dl class="grid gap-2 text-sm">
      {#each stats as stat (stat.label)}
        <div class="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
          <dt class="font-medium">{stat.label}</dt>
          <dd class="min-w-0 truncate text-right text-muted-foreground tabular-nums">
            {stat.value}
          </dd>
        </div>
      {/each}
    </dl>
  </Card.Content>
</Card.Root>
