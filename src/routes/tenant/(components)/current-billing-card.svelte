<script lang="ts" module>
  import type { ComputedBilling } from "#lib/types/tenant.js";

  export type CurrentBillingCardProps = { billing: ComputedBilling };
</script>

<script lang="ts">
  import * as Card from "#lib/components/ui/card/index.js";
  import { InvoiceIcon } from "#lib/assets/icons.js";
  import { formatDate, formatEnergy, formatNumber } from "#lib/utils/format.js";
  import StatRow from "./stat-row.svelte";

  let { billing }: CurrentBillingCardProps = $props();
</script>

<Card.Root class="h-full">
  <Card.Header class="border-b">
    <h2 class="flex items-center gap-2 text-sm leading-none font-semibold tracking-tight">
      <InvoiceIcon class="h-4 w-4 text-muted-foreground" />
      Current billing
    </h2>
    <Card.Description class="text-xs">
      Your bill for the period of {formatDate(billing.date)}
    </Card.Description>
  </Card.Header>
  <Card.Content class="space-y-2">
    <StatRow label="Your reading" value={billing.reading} />
    <StatRow label="Usage" value={formatEnergy(billing.usageKwh)} />
    <StatRow label="Rate" value="{formatNumber(billing.payPerkWh)}/kWh" />
    <StatRow label="Amount due" value={formatNumber(billing.amount)} emphasis />
  </Card.Content>
</Card.Root>
