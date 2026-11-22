<script lang="ts" module>
  export type Disable2FAFormProps = { busy?: boolean };

  const FORM_ID = "account-disable-2fa-form";
</script>

<script lang="ts">
  import { useModalFooter } from "#lib/components/dynamic-modal.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import OtpCodeInput from "#lib/components/otp-code-input.svelte";
  import { Loader, ShieldOff } from "#lib/assets/icons.js";
  import { disable2FA } from "#lib/api/auth.remote.js";
  import { notifyResult } from "#lib/utils/notify.js";

  let { busy = $bindable(false) }: Disable2FAFormProps = $props();

  useModalFooter(actions);
</script>

<div class="rounded-lg border border-destructive/50 bg-destructive/0.5 p-4">
  <h5 class="font-medium text-destructive">Disable Two-Factor Authentication</h5>
  <p class="mt-1 text-sm text-destructive/80">
    Enter your current 2FA code to disable two-factor authentication.
  </p>
  <form
    id={FORM_ID}
    class="mt-4 flex justify-center"
    {...disable2FA.enhance(async ({ submit, element }) => {
      if (busy) return;
      busy = true;
      const saved = await notifyResult({
        loading: "Disabling 2FA...",
        success: "2FA disabled successfully",
        failure: "Failed to disable 2FA",
        run: submit,
        issues: () => disable2FA.fields.allIssues(),
      });
      if (saved) element.reset();
      busy = false;
    })}
  >
    <OtpCodeInput field={disable2FA.fields.code} />
  </form>
</div>

{#snippet actions()}
  <div class="flex justify-end">
    <Button
      type="submit"
      form={FORM_ID}
      variant="destructive"
      disabled={disable2FA.fields.code.value()?.length !== 6 || busy}
    >
      {#if busy}
        <Loader class="size-4 animate-spin" />
        Disabling...
      {:else}
        <ShieldOff class="size-4" />
        Disable 2FA
      {/if}
    </Button>
  </div>
{/snippet}
