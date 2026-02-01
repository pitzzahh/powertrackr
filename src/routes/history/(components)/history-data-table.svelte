<script module lang="ts">
  import type { DataTableProps } from "$/components/data-table/data-table.svelte";

  export interface HistoryDataTableProps {
    data: ExtendedBillingInfoTableView[];
    data_table_props?: Partial<DataTableProps<ExtendedBillingInfoTableView, unknown>>;
    status: AsyncState;
  }
</script>

<script lang="ts">
  import { generateOptions } from "$/utils/mapper";
  import { showSuccess } from "$/components/toast";
  import type { ExtendedBillingInfoTableView } from "$/types/billing-info";
  import { useBillingStore } from "$/stores/billing.svelte";
  import { historyTableColumns, HistoryDataTableToolbar } from ".";
  import { DataTable, DataTableFloatingBar } from "$/components/data-table";
  import type { AsyncState } from "$/types/state";
  import { deleteBillingInfoBatch } from "$/api/billing-info.remote";

  let { data, data_table_props, status }: HistoryDataTableProps = $props();

  const billingStore = useBillingStore();
</script>

<section class="flex flex-col gap-2">
  <DataTable {data} {status} columns={historyTableColumns()} {...data_table_props}>
    {#snippet data_table_toolbar({ table })}
      <HistoryDataTableToolbar
        {table}
        statuses={generateOptions(data, "status")}
        default_hidden_columns={["id", "userId", "paymentId", "createdAt", "updatedAt"]}
      />
    {/snippet}
    {#snippet floating_bar({ table })}
      <DataTableFloatingBar
        {table}
        entity_name="Billing Info"
        entity_name_plural="Billing Infos"
        delete_fn={(rows, count) => {
          return deleteBillingInfoBatch({
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
