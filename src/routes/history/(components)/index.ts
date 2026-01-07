import { DataTableCheckbox, DataTableColumnHeader } from "$/components/data-table";
import { Badge } from "$/components/ui/badge";
import { renderComponent } from "$/components/ui/data-table";

import type { ExtendedBillingInfoTableView } from "$/types/billing-info";
import type { ColumnDef, Table } from "@tanstack/table-core";
import { createRawSnippet } from "svelte";
import PaymentCell from "./payment-cell.svelte";
import { HistoryDataTableRowActions } from ".";
import { formatNumber } from "$/utils/format";

import SubPaymentsButton from "./sub-payments-button.svelte";

export function historyTableColumns() {
  return [
    {
      id: "select",
      header: ({ table }: { table: Table<ExtendedBillingInfoTableView> }) =>
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
        renderComponent(DataTableColumnHeader<ExtendedBillingInfoTableView, unknown>, {
          column,
          title: "Date",
        }),
      cell: ({ row }) =>
        renderComponent(Badge, {
          children: createRawSnippet(() => {
            return {
              render: () => `<span>${row.original.date}</span>`,
            };
          }),
        }),
      filterFn: (row, id, value) => {
        const dateStr = row.getValue(id) as string;
        return dateStr === value || dateStr.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      accessorKey: "totalKwh",
      header: ({ column }) => {
        return renderComponent(DataTableColumnHeader<ExtendedBillingInfoTableView, unknown>, {
          column,
          title: "Total KWh",
        });
      },
      cell: ({ row }) => {
        const totalKWh = row.original.totalKWh;
        return totalKWh ? `${totalKWh}KWh` : "N/A";
      },
      filterFn: (row, id, value) => {
        return (
          value.includes(row.getValue(id)) ||
          row.original.totalKWh?.toString()?.toLowerCase().includes(value.toLowerCase()) ||
          row.original.totalKWh?.toString()?.toLowerCase().startsWith(value.toLowerCase())
        );
      },
    },
    {
      accessorKey: "payPerKwh",
      header: ({ column }) => {
        return renderComponent(DataTableColumnHeader<ExtendedBillingInfoTableView, unknown>, {
          column,
          title: "Pay Per kWh",
        });
      },
      cell: ({ row }) => formatNumber(row.original.payPerKwh),
      filterFn: (row, id, value) => {
        return (
          value.includes(row.getValue(id)) ||
          row.original.payPerKwh?.toString()?.toLowerCase().includes(value.toLowerCase()) ||
          row.original.payPerKwh?.toString()?.toLowerCase().startsWith(value.toLowerCase())
        );
      },
    },
    {
      accessorKey: "balance",
      header: ({ column }) => {
        return renderComponent(DataTableColumnHeader<ExtendedBillingInfoTableView, unknown>, {
          column,
          title: "Balance",
        });
      },
      cell: ({ row }) => {
        const balance = row.original.balance;
        return renderComponent(Badge, {
          variant: "outline",
          title: formatNumber(balance),
          children: createRawSnippet(() => {
            return {
              render: () => `<span>${balance}</span>`,
            };
          }),
        });
      },
      filterFn: (row, id, value) => {
        console.log({
          balance: row.getValue(id),
          value,
        });
        const balanceStr = String(row.getValue(id));
        return balanceStr === value || balanceStr.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      accessorKey: "payment",
      header: ({ column }) => {
        return renderComponent(DataTableColumnHeader<ExtendedBillingInfoTableView, unknown>, {
          column,
          title: "Payment",
        });
      },
      cell: ({ row }) => {
        // we can just use row.original.payment here, but looks cooler this way, fetching by id
        return renderComponent(PaymentCell, {
          paymentId: row.original.paymentId,
        });
      },
      filterFn: (row, id, value) => {
        const payment = row.original.payment;
        if (!payment || payment.amount == null) return false;
        const paymentStr = payment.amount.toString();
        return paymentStr === value || paymentStr.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return renderComponent(DataTableColumnHeader<ExtendedBillingInfoTableView, unknown>, {
          column,
          title: "Status",
        });
      },
      cell: ({ row }) => {
        const status = row.original.status;
        return renderComponent(Badge, {
          title: status,
          variant: status === "Paid" ? "default" : "destructive",
          children: createRawSnippet(() => {
            return {
              render: () => `<span>${status}</span>`,
            };
          }),
        });
      },
      filterFn: (row, id, value) => {
        if (Array.isArray(value)) {
          return (value as string[]).some(
            (v) => v.toLowerCase() === row.original.status.toLowerCase(),
          );
        }
        const statusStr = row.getValue(id) as string;
        return statusStr === value || statusStr.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) =>
        renderComponent(DataTableColumnHeader<ExtendedBillingInfoTableView, unknown>, {
          column,
          title: "Created",
        }),
      cell: ({ row }) =>
        renderComponent(Badge, {
          variant: "outline",
          children: createRawSnippet(() => {
            return {
              render: () => `<span>${row.original.createdAt}</span>`,
            };
          }),
        }),
      filterFn: (row, id, value) => {
        const dateStr = row.getValue(id) as string;
        return dateStr === value || dateStr.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) =>
        renderComponent(DataTableColumnHeader<ExtendedBillingInfoTableView, unknown>, {
          column,
          title: "Updated",
        }),
      cell: ({ row }) =>
        renderComponent(Badge, {
          variant: "outline",
          children: createRawSnippet(() => {
            return {
              render: () => `<span>${row.original.updatedAt}</span>`,
            };
          }),
        }),
      filterFn: (row, id, value) => {
        const dateStr = row.getValue(id) as string;
        return dateStr === value || dateStr.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      id: "sub-payments",
      header: ({ column }) =>
        renderComponent(DataTableColumnHeader<ExtendedBillingInfoTableView, unknown>, {
          column,
          title: "Sub Payments",
        }),
      cell: ({ row }) => {
        return renderComponent(SubPaymentsButton, {
          row: row.original,
          size: "sm",
        });
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "actions",
      header: ({ column }) =>
        renderComponent(DataTableColumnHeader<ExtendedBillingInfoTableView, unknown>, {
          column,
          title: "ACTIONS",
          class: "font-semibold text-center",
        }),
      cell: ({ row }) => {
        return renderComponent(HistoryDataTableRowActions, {
          row,
        });
      },
    },
  ] as ColumnDef<ExtendedBillingInfoTableView, any>[];
}

export { default as HistoryDataTableToolbar } from "./history-data-table-toolbar.svelte";
export { default as HistoryDataTable } from "./history-data-table.svelte";
export { default as HistoryDataTableRowActions } from "./history-data-table-row-actions.svelte";
export { default as SubPaymentsDialog } from "./sub-payments-dialog.svelte";

export { default as SubPaymentsButton } from "./sub-payments-button.svelte";
