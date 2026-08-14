<script module lang="ts">
  import type { DataTableProps } from "#lib/components/data-table/data-table.svelte";

  export interface HistoryDataTableProps {
    data: ExtendedBillingInfoTableView[];
    data_table_props?: Partial<DataTableProps<ExtendedBillingInfoTableView, unknown>>;
    status: AsyncState;
  }
</script>

<script lang="ts">
  import { generateOptions } from "#lib/utils/mapper.js";
  import { showSuccess } from "#lib/components/toast/index.js";
  import type { ExtendedBillingInfoTableView } from "#lib/types/billing-info.js";
  import { useBillingStore } from "#lib/stores/billing.svelte.js";
  import { historyTableColumns, HistoryDataTableToolbar } from ".";
  import { DataTable, DataTableFloatingBar } from "#lib/components/data-table/index.js";
  import type { AsyncState } from "#lib/types/state.js";
  import { deleteBillingInfoBatch } from "#lib/api/billing-info.remote.js";

  let { data, data_table_props, status }: HistoryDataTableProps = $props();

  const billingStore = useBillingStore();
</script>

<section class="flex flex-col gap-2">
  <DataTable {data} {status} columns={historyTableColumns()} {...data_table_props}>
    {#snippet data_table_toolbar({ table })}
      <HistoryDataTableToolbar
        {table}
        statuses={generateOptions(data, "status")}
        default_hidden_columns={[
          "id",
          "userId",
          "paymentId",
          "createdAtFormatted",
          "updatedAtFormatted",
        ]}
      />
    {/snippet}
    {#snippet floating_bar({ table })}
      <DataTableFloatingBar
        {table}
        entity_name="Billing Info"
        entity_name_plural="Billing Infos"
        delete_fn={async (rows, count) => {
          return await deleteBillingInfoBatch({
            ids: rows.map((r) => r.id),
            count,
          });
        }}
        callback={(valid) => {
          if (!valid) return;
          billingStore.refresh();
          showSuccess("Deletion Successful", "Billing Info record has been successfully removed.");
        }}
      />
    {/snippet}
  </DataTable>
</section>
