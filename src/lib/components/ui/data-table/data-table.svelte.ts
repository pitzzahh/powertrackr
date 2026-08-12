import {
  type CellContext,
  type CellData,
  type Column,
  type ColumnDef,
  type HeaderContext,
  type Row,
  type RowData,
  type Table,
  type TableOptions,
  createExpandedRowModel,
  createFacetedMinMaxValues,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createGroupedRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  createTable,
  stockFeatures,
  tableFeatures,
} from "@tanstack/svelte-table";

/**
 * The feature set used by every table in the app: all stock features plus the
 * row-model factories they require (v9 moves row models from table options
 * onto the `features` object).
 */
const features = tableFeatures({
  ...stockFeatures,
  // coreRowModel is automatic in v9; register the optional row models.
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  groupedRowModel: createGroupedRowModel(),
  expandedRowModel: createExpandedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  facetedMinMaxValues: createFacetedMinMaxValues(),
});

/** App-level table type with the app's feature set pre-bound. */
export type SvelteTable<TData extends RowData> = Table<typeof features, TData>;
/** App-level column type with the app's feature set pre-bound. */
export type SvelteColumn<TData extends RowData, TValue = unknown> = Column<
  typeof features,
  TData,
  TValue
>;
/** App-level row type with the app's feature set pre-bound. */
export type SvelteRow<TData extends RowData> = Row<typeof features, TData>;
/** App-level column definition type with the app's feature set pre-bound. */
export type SvelteColumnDef<TData extends RowData, TValue extends CellData = CellData> = ColumnDef<
  typeof features,
  TData,
  TValue
>;
/** App-level header context type with the app's feature set pre-bound. */
export type SvelteHeaderContext<TData extends RowData, TValue = unknown> = HeaderContext<
  typeof features,
  TData,
  TValue
>;
/** App-level cell context type with the app's feature set pre-bound. */
export type SvelteCellContext<TData extends RowData, TValue extends CellData = CellData> = CellContext<
  typeof features,
  TData,
  TValue
>;

/**
 * Creates a reactive TanStack Table v9 object for Svelte 5.
 *
 * The official `@tanstack/svelte-table` adapter backs this: options are
 * re-synced in `$effect.pre` (so reactive `get data()`/`get columns()` getters
 * and controlled `state` getters stay live) and state reads through
 * `table.atoms.*` participate in Svelte dependency tracking.
 *
 * @param options Table options to create the table with.
 * @returns A reactive table object.
 * @example
 * ```svelte
 * <script>
 *   const table = createSvelteTable({ data, columns, ... })
 * </script>
 *
 * <table>
 *   <thead>
 *     {#each table.getHeaderGroups() as headerGroup}
 *       <tr>
 *         {#each headerGroup.headers as header}
 *           <th colspan={header.colSpan}>
 *           	 <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
 *         	 </th>
 *         {/each}
 *       </tr>
 *     {/each}
 *   </thead>
 *   <!-- ... -->
 * </table>
 * ```
 */
export function createSvelteTable<TData extends RowData>(
  options: Omit<TableOptions<typeof features, TData>, "features" | "columns"> & {
    columns: ReadonlyArray<ColumnDef<typeof features, TData, any>>;
  }
): SvelteTable<TData> {
  return createTable({
    ...options,
    features,
  });
}
