<script lang="ts">
  import "./layout.css";
  import { ModeWatcher } from "mode-watcher";
  import favicon from "$lib/assets/favicon.svg";
  import FocusRing from "$lib/components/focus-ring.svelte";

  const { children } = $props();
</script>

<ModeWatcher />
<FocusRing />

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>
{@render children()}
