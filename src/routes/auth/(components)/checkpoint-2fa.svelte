<script lang="ts" module>
  import type { AsyncState } from "#lib/types/state.js";
</script>

<script lang="ts">
  import OtpCodeInput from "#lib/components/otp-code-input.svelte";
  import { FieldGroup, Field, FieldLabel, FieldError } from "#lib/components/ui/field/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Loader } from "#lib/assets/icons.js";
  import { checkpoint2FA, signout } from "#lib/api/auth.remote.js";
  import { showError, showLoading, showSuccess, showWarning } from "#lib/components/toast/index.js";
  import { toast } from "svelte-sonner";
  import { isHttpError } from "@sveltejs/kit";
  import RecoveryCodeForm from "./recovery-code-form.svelte";

  let status: AsyncState = $state("idle");
  let useRecoveryCode = $state(false);
</script>

{#if useRecoveryCode}
  <RecoveryCodeForm oncancel={() => (useRecoveryCode = false)} />
{:else}
  <form
    {@attach () => {
      showWarning("Two Factor Authentication Required");
    }}
    class="flex w-full flex-col gap-6"
    {...checkpoint2FA.enhance(async ({ submit, element }) => {
      if (status === "processing") return;
      status = "processing";
      const toastId = showLoading("Verifying two-factor authentication...");
      try {
        await submit();
        const issues = checkpoint2FA.fields.allIssues?.() || [];
        if (issues.length > 0) {
          showWarning(issues.map((i) => i.message).join(", "));
        } else {
          element.reset();
          showSuccess("Two-factor authentication verified");
        }
      } catch (e) {
        const message = isHttpError(e) ? e.body?.message : String(e);
        console.error("Checkpoint2FA error:", e);
        showWarning(message || "Failed to verify two-factor code. Please try again.");
      } finally {
        toast.dismiss(toastId);
        status = "idle";
      }
    })}
  >
    <FieldGroup>
      <div class="flex flex-col items-center gap-1 text-center">
        <h1 class="text-2xl font-bold">Two-factor authentication required</h1>
        <p class="text-sm text-muted-foreground">
          Enter the 6-digit code from your authenticator app to continue.
        </p>
      </div>

      <Field class="my-6">
        <FieldLabel for="checkpoint-otp">Authentication code</FieldLabel>

        <div class="flex justify-center">
          <OtpCodeInput field={checkpoint2FA.fields.code} autofocus />
        </div>
        <FieldError errors={checkpoint2FA.fields.code.issues()} />
      </Field>

      <Button
        type="submit"
        disabled={checkpoint2FA.fields?.code.value()?.length !== 6 || status === "processing"}
        class="min-w-32"
      >
        {#if status === "processing"}
          <Loader class="size-4 animate-spin" />
          Verifying...
        {:else}
          Verify
        {/if}
      </Button>
      <Button type="button" variant="link" onclick={() => (useRecoveryCode = true)}>
        Lost your authenticator? Use a recovery code
      </Button>
    </FieldGroup>
  </form>
{/if}
<div class="mt-4 flex justify-center">
  <form
    {...signout.enhance(async ({ submit }) => {
      const toastId = showLoading("Logging out...");
      try {
        await submit();
        showSuccess("Logged out successfully");
      } catch (e) {
        showError("Failed to logout. Please try again.");
      } finally {
        toast.dismiss(toastId);
      }
    })}
    class="flex"
  >
    <Button
      type="submit"
      variant="link"
      disabled={status === "processing"}
      aria-label="Login with another account"
    >
      Login with another account
    </Button>
  </form>
</div>
