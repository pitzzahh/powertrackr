<script lang="ts" module>
  // SvelteKit's own messages ("Not Found", "Internal Error") are terse; these read better.
  const TITLES: Record<number, string> = {
    401: "Sign in to see this page",
    403: "You don't have access to this page",
    404: "We couldn't find that page",
    500: "Something went wrong",
  };
  const GENERIC = new Set(["Not Found", "Internal Error", "Forbidden", "Unauthorized"]);

  export type ErrorViewProps = { error: App.Error; href: string; label: string };
</script>

<script lang="ts">
  import { Button } from "#lib/components/ui/button/index.js";
  import { ChevronLeft } from "#lib/assets/icons.js";

  let { error, href, label }: ErrorViewProps = $props();

  const title = $derived(TITLES[error.status] ?? error.message);
  const detail = $derived(
    title !== error.message && !GENERIC.has(error.message) ? error.message : null
  );
</script>

<svelte:head>
  <title>{error.status} · PowerTrackr</title>
</svelte:head>

<div class="grid min-h-[60svh] place-items-center px-4 py-16">
  <div class="w-full max-w-sm">
    <p class="text-sm text-muted-foreground tabular-nums">Error {error.status}</p>
    <h1 class="mt-2 text-2xl font-semibold tracking-tight text-balance">{title}</h1>
    {#if detail}
      <p class="mt-2 text-muted-foreground">{detail}</p>
    {/if}
    <Button {href} class="mt-6">
      <ChevronLeft class="size-4" />
      {label}
    </Button>
  </div>
</div>
