<script module lang="ts">
  import { TriangleAlert } from "$lib/assets/icons";

  export type WarningBannerProps = {
    message: string;
  };

  export { WarningBanner };
</script>

{#snippet WarningBanner({ message }: WarningBannerProps)}
  <span class="mt-4 block border-l-4 border-amber-500 bg-amber-500/10 p-3" role="alert">
    <span class="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-500">
      <TriangleAlert class="size-4" />
      Warning
    </span>
    <span class="mt-1 block text-sm text-amber-800 dark:text-amber-400">
      {message}
    </span>
  </span>
{/snippet}
