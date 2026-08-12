<script lang="ts">
  let { index, label, note }: { index?: string; label: string; note?: string } = $props();
</script>

<div class="flex items-center gap-3 text-muted-foreground">
  {#if index}
    <span class="font-mono text-xs text-primary">{index}</span>
    <span class="h-3.5 w-px bg-border" aria-hidden="true"></span>
  {/if}
  <p class="font-mono text-[11px] font-medium tracking-[0.3em] uppercase">{label}</p>
  {#if note}
    <span class="hidden text-sm text-muted-foreground sm:inline">— {note}</span>
  {/if}
  <div class="h-px flex-1 bg-linear-to-r from-border/80 to-transparent" aria-hidden="true"></div>
</div>
