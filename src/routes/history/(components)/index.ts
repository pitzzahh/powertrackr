import {
  DataTableCheckbox,
  DataTableColumnHeader,
} from "$/components/data-table";
import { Badge } from "$/components/ui/badge";
import { renderComponent } from "$/components/ui/data-table";
import { getPayment } from "$/remotes/payment.remote";
import type { BillingInfo } from "$/server/db/schema/billing-info";
import { DateFormat, formatDate, formatNumber } from "$/utils/format";
import type { ColumnDef, Table } from "@tanstack/table-core";
import { createRawSnippet } from "svelte";
import PaymentCell from "./payment-cell.svelte";

export function historyTableColumns() {
  return [
    {
      id: "select",
      header: ({ table }: { table: Table<BillingInfo> }) =>
        renderComponent(DataTableCheckbox, {
          checked: table.getIsAllPageRowsSelected(),
          indeterminate: table.getIsSomePageRowsSelected(),
          onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
          "aria-label": "Select all",
          class: "translate-y-[2px]",
        }),
      cell: ({ row }) =>
        renderComponent(DataTableCheckbox, {
          checked: row.getIsSelected(),
          onCheckedChange: (value) => row.toggleSelected(!!value),
          "aria-label": "Select row",
          class: "translate-y-[2px]",
        }),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "date",
      header: ({ column }) =>
        renderComponent(DataTableColumnHeader<BillingInfo, unknown>, {
          column,
          title: "Date",
        }),
      cell: ({ row }) =>
        renderComponent(Badge, {
          children: createRawSnippet(() => {
            return {
              render: () =>
                `<span>${formatDate(new Date(row.original.date), {
                  format: DateFormat.DateOnly,
                })}</span>`,
            };
          }),
        }),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "totalKwh",
      header: ({ column }) => {
        return renderComponent(DataTableColumnHeader<BillingInfo, unknown>, {
          column,
          title: "Total KWh",
        });
      },
      cell: ({ row }) => {
        const totalKWh = row.original.totalKwh;
        return totalKWh ? `${totalKWh}KWh` : "N/A";
      },
      filterFn: (row, id, value) => {
        return (
          value.includes(row.getValue(id)) ||
          row.original.totalKwh
            ?.toString()
            ?.toLowerCase()
            .includes(value.toLowerCase()) ||
          row.original.totalKwh
            ?.toString()
            ?.toLowerCase()
            .startsWith(value.toLowerCase())
        );
      },
    },
    {
      accessorKey: "subKwh",
      header: ({ column }) => {
        return renderComponent(DataTableColumnHeader<BillingInfo, unknown>, {
          column,
          title: "Sub KWh",
        });
      },
      cell: ({ row }) => {
        const subKwh = row.original.subKwh;
        return subKwh ? `${subKwh}KWh` : "N/A";
      },
      filterFn: (row, id, value) => {
        return (
          value.includes(row.getValue(id)) ||
          row.original.subKwh
            ?.toString()
            ?.toLowerCase()
            .includes(value.toLowerCase()) ||
          row.original.subKwh
            ?.toString()
            ?.toLowerCase()
            .startsWith(value.toLowerCase())
        );
      },
    },
    {
      id: "balance",
      header: ({ column }) => {
        return renderComponent(DataTableColumnHeader<BillingInfo, unknown>, {
          column,
          title: "Balance",
        });
      },
      cell: ({ row }) => {
        const balance = row.original.balance;
        return renderComponent(Badge, {
          title: formatNumber(balance),
          children: createRawSnippet(() => {
            return {
              render: () => `<span>${balance}</span>`,
            };
          }),
        });
      },
      filterFn: (row, id, value) => {
        return value.includes(row.original.balance.toString());
      },
    },
    {
      id: "payment",
      header: ({ column }) => {
        return renderComponent(DataTableColumnHeader<BillingInfo, unknown>, {
          column,
          title: "Payment",
        });
      },
      cell: ({ row }) => {
        return renderComponent(PaymentCell, {
          paymentId: row.original.paymentId,
        });
      },
      filterFn: async (row, id, value) => {
        const payment = await getPayment(row.original.paymentId!);
        return value.includes(payment.amount);
      },
    },
    {
      id: "subPayment",
      header: ({ column }) => {
        return renderComponent(DataTableColumnHeader<BillingInfo, unknown>, {
          column,
          title: "Sub Payment",
        });
      },
      cell: ({ row }) => {
        return renderComponent(PaymentCell, {
          paymentId: row.original.subPaymentId,
        });
      },
      filterFn: async (row, id, value) => {
        const subPayment = await getPayment(row.original.subPaymentId!);
        return value.includes(subPayment.amount);
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return renderComponent(DataTableColumnHeader<BillingInfo, unknown>, {
          column,
          title: "Status",
        });
      },
      cell: ({ row }) => {
        const status = row.original.status;
        return renderComponent(Badge, {
          title: status,
          children: createRawSnippet(() => {
            return {
              render: () => `<span>${status}</span>`,
            };
          }),
        });
      },
      filterFn: (row, id, value) => {
        return value.toLowerCase().includes(row.original.status.toLowerCase());
      },
    },
    // {
    //   id: "actions",
    //   header: ({ column }) =>
    //     renderComponent(DataTableColumnHeader<BillingInfo, unknown>, {
    //       column,
    //       title: "ACTIONS",
    //       class: "font-semibold text-center",
    //     }),
    //   cell: ({ row }) => {
    //     return renderComponent(BillingInfoDataTableRowActions, {
    //       sync_manager_options,
    //       row,
    //       BillingInfo_form,
    //     });
    //   },
    // },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as ColumnDef<BillingInfo, any>[];
}

export { default as HistoryDataTableToolbar } from "./history-data-table-toolbar.svelte";
export { default as HistoryDataTable } from "./history-data-table.svelte";
