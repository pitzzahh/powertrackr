<script lang="ts">
  import { Toaster } from "svelte-sonner";
  import { mode } from "mode-watcher";
</script>

<Toaster theme={mode.current} position="bottom-right" closeButton={false} />
