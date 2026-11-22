<script lang="ts" module>
  export type DataPreviewProps = {
    counts: { label: string; value: number }[];
    json: string;
  };
</script>

<script lang="ts">
  import { Table, TableBody, TableCell, TableRow } from "#lib/components/ui/table/index.js";
  import { ScrollArea } from "#lib/components/ui/scroll-area/index.js";

  let { counts, json }: DataPreviewProps = $props();
</script>

<div class="mt-4 space-y-4">
  <Table class="max-w-full rounded-md border bg-background">
    <TableBody>
      {#each counts as row (row.label)}
        <TableRow class="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
          <TableCell class="min-w-0 bg-muted/50 py-2 font-medium">{row.label}</TableCell>
          <TableCell class="min-w-0 py-2">{row.value}</TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>

  <ScrollArea maxHeight="none" class="h-72 rounded-md border bg-muted/10">
    <div class="p-4">
      <pre class="text-xs whitespace-pre-wrap">{json}</pre>
    </div>
  </ScrollArea>
</div>
