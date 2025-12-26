<script module lang="ts">
  import type { DataTableProps } from "$/components/data-table/data-table.svelte";

  export interface HistoryDataTableProps {
    data: BillingInfo[];
    data_table_props?: Partial<DataTableProps<BillingInfo, unknown>>;
  }
</script>

<script lang="ts">
  import { DataTable, DataTableFloatingBar } from "$/components/data-table";
  import { historyTableColumns, HistoryDataTableToolbar } from ".";
  import { generateOptions } from "$/utils/mapper";
  import { toast } from "svelte-sonner";
  import { Toast } from "$/components/toast";
  import type { BillingInfo } from "$/server/db/schema/billing-info";
  import { scale } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";

  let { data, data_table_props }: HistoryDataTableProps = $props();
</script>

<section
  in:scale={{ duration: 250, easing: cubicInOut, start: 0.8 }}
  class="flex flex-col gap-2"
>
  <DataTable {data} columns={historyTableColumns()} {...data_table_props}>
    {#snippet data_table_toolbar({ table })}
      <HistoryDataTableToolbar
        {table}
        statuses={generateOptions(data, "status")}
        default_hidden_columns={["id", "userId", "paymentId", "subPaymentId"]}
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
