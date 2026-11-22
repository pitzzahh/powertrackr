<script lang="ts">
  import type { ErrorProps } from "./$types";
  import { page } from "$app/state";
  import { resolve } from "$app/paths";
  import ErrorView from "#routes/(components)/shell/error-view.svelte";

  let { error }: ErrorProps = $props();
</script>

{#if page.data.user}
  <ErrorView {error} href={resolve("/dashboard")} label="Back to dashboard" />
{:else}
  <ErrorView {error} href={resolve("/")} label="Back to home" />
{/if}
