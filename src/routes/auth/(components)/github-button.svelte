<script lang="ts" module>
  export type GithubButtonProps = {
    label: string;
    disabled?: boolean;
    busy?: boolean;
  };
</script>

<script lang="ts">
  import { Button } from "#lib/components/ui/button/index.js";
  import { Github, Loader } from "#lib/assets/icons.js";
  import { showError, showLoading } from "#lib/components/toast/index.js";
  import { loginWithGithub } from "#lib/api/github.remote.js";
  import { isHttpError } from "@sveltejs/kit";
  import { toast } from "svelte-sonner";

  let { label, disabled = false, busy = $bindable(false) }: GithubButtonProps = $props();

  async function start() {
    busy = true;
    const toastId = showLoading(`${label}…`);
    try {
      const { redirect } = await loginWithGithub();
      if (redirect) {
        window.location.href = redirect;
        return; // keep the spinner while the browser leaves
      }
    } catch (e) {
      showError((isHttpError(e) && e.body.message) || "GitHub sign-in failed. Please try again.");
    }
    toast.dismiss(toastId);
    busy = false;
  }
</script>

<Button variant="outline" disabled={disabled || busy} aria-label={label} onclick={start}>
  {#if busy}
    <Loader class="size-5 animate-spin" />
  {:else}
    <Github />
    {label}
  {/if}
</Button>
