<script module lang="ts">
  import type { DataTableProps } from "$/components/data-table/data-table.svelte";

  export interface HistoryDataTableProps {
    data: ExtendedBillingInfoTableView[];
    data_table_props?: Partial<DataTableProps<ExtendedBillingInfoTableView, unknown>>;
    status: Status;
  }
</script>

<script lang="ts">
  import { generateOptions } from "$/utils/mapper";
  import { toast } from "svelte-sonner";
  import { Toast } from "$/components/toast";
  import type { ExtendedBillingInfoTableView } from "$/types/billing-info";

  let { data, data_table_props, status }: HistoryDataTableProps = $props();

  import { historyTableColumns, HistoryDataTableToolbar } from ".";
  import { DataTable, DataTableFloatingBar } from "$/components/data-table";
  import type { Status } from "$/types/state";
</script>

<section class="flex flex-col gap-2">
  <DataTable
    {data}
    {status}
    columns={historyTableColumns()}
    {...data_table_props}
  >
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
        delete_fn={(row) => {
          alert("Not yet implemented " + row);
          return Promise.resolve(0);
        }}
        callback={(valid) => {
          if (!valid) return;
          toast.custom(Toast, {
            componentProps: {
              title: "Deletion Successful",
              description: "Billing Info record has been successfully removed.",
            },
          });
        }}
      />
    {/snippet}
  </DataTable>
</section>
