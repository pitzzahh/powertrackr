<script lang="ts" module>
  export type RecoveryCodePanelProps = { code: string };
</script>

<script lang="ts">
  import { Button } from "#lib/components/ui/button/index.js";
  import { Check, Copy, ShieldCheck } from "#lib/assets/icons.js";
  import { showWarning } from "#lib/components/toast/index.js";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  let { code }: RecoveryCodePanelProps = $props();

  let copied = $state(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      showWarning("Couldn't copy — select the code and copy it manually.");
    }
  }
</script>

<div
  class="rounded-lg border border-green-500/50 bg-green-50 p-4 dark:bg-green-900/20"
  transition:fly={{ y: 10, duration: 300, easing: cubicOut }}
>
  <div class="flex items-center gap-2">
    <ShieldCheck class="size-5 text-green-500" />
    <h5 class="font-medium text-green-700 dark:text-green-400">2FA Setup Complete!</h5>
  </div>
  <p class="mt-2 text-sm text-green-600 dark:text-green-300">
    Save your recovery code in a safe place. You'll need it if you lose access to your authenticator
    app.
  </p>
  <div class="mt-4 flex items-center gap-2">
    <code
      class="flex-1 rounded bg-white p-3 text-center font-mono text-lg select-all dark:bg-gray-800"
    >
      {code}
    </code>
    <Button variant="outline" size="icon" onclick={copy} aria-label="Copy recovery code">
      {#if copied}
        <Check class="size-4 text-green-500" />
      {:else}
        <Copy class="size-4" />
      {/if}
    </Button>
  </div>
  <Button class="mt-4 w-full" href="/dashboard">
    <ShieldCheck class="size-4" />
    Done
  </Button>
</div>
