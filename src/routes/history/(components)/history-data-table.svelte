<script module lang="ts">
  import type { DataTableProps } from "$/components/data-table/data-table.svelte";

  export interface SalesDataTableProps {
    data: BillingInfo[];
    data_table_props?: Partial<DataTableProps<BillingInfo, any>>;
  }
</script>

<script lang="ts">
  import { DataTable, DataTableFloatingBar } from "$/components/data-table";
  import { sales_table_columns, SalesDataTableToolbar } from ".";
  import { generateOptions } from "@/utils/mapper";
  import { toast } from "svelte-sonner";
  import { Toast } from "@/components/ui/toast";
  import { deleteSale } from "@/db/services/sales.service";
  import type { BillingInfo } from "$/server/db/schema/billing-info";

  let {
    sync_manager_options,
    data,
    data_table_props,
    customer_types,
    sale_form,
  }: SalesDataTableProps = $props();
</script>

<DataTable
  {data}
  columns={sales_table_columns(sync_manager_options, customer_types, sale_form)}
  {...data_table_props}
>
  {#snippet data_table_toolbar({ table })}
    <SalesDataTableToolbar
      {table}
      receipt_numbers={generateOptions(data, "receipt_number")}
      payment_methods={generateOptions(data, "payment_method")}
      default_hidden_columns={["created_at", "updated_at"]}
    />
  {/snippet}
  {#snippet floating_bar({ table })}
    <DataTableFloatingBar
      {table}
      entity_name="sale"
      entity_name_plural="sales"
      delete_fn={(row) => deleteSale(sync_manager_options, row.id)}
      callback={(valid) => {
        if (!valid) return;
        toast.custom(Toast, {
          componentProps: {
            title: "Deletion Successful",
            description: "Sale record has been successfully removed.",
          },
        });
      }}
    />
  {/snippet}
</DataTable>
