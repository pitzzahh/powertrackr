<script lang="ts">
  import type { ErrorProps } from "./$types";
  import { resolve } from "$app/paths";
  import ErrorView from "#routes/(components)/shell/error-view.svelte";

  let { error }: ErrorProps = $props();
</script>

<ErrorView {error} href={resolve("/auth")} label="Back to sign in" />
