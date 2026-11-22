<script lang="ts" module>
  export type StatRowProps = {
    label: string;
    value: string | number;
    emphasis?: boolean;
  };
</script>

<script lang="ts">
  let { label, value, emphasis = false }: StatRowProps = $props();
</script>

<div class="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm">
  <span class="font-medium">{label}</span>
  <span
    class={[
      "min-w-0 text-right tabular-nums",
      emphasis ? "font-semibold text-accent-foreground" : "text-muted-foreground",
    ]}
  >
    {value}
  </span>
</div>
