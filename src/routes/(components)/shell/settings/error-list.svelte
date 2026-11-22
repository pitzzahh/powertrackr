<script lang="ts" module>
  export type ErrorListProps = { title: string; errors: string[] };
</script>

<script lang="ts">
  import * as Alert from "#lib/components/ui/alert/index.js";

  let { title, errors }: ErrorListProps = $props();
</script>

{#if errors.length}
  <Alert.Root variant="destructive" class="mt-4">
    <Alert.Title>{title}</Alert.Title>
    <Alert.Description>
      {#each errors as err, i (i)}
        <div>{err}</div>
      {/each}
    </Alert.Description>
  </Alert.Root>
{/if}
