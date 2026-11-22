<script lang="ts" module>
  import type { AsyncState } from "#lib/types/state.js";

  export type RecoveryCodeFormProps = {
    oncancel: () => void;
  };
</script>

<script lang="ts">
  import { FieldGroup, Field, FieldLabel, FieldError } from "#lib/components/ui/field/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Loader } from "#lib/assets/icons.js";
  import { recover2FA } from "#lib/api/auth.remote.js";
  import { showLoading, showWarning } from "#lib/components/toast/index.js";
  import { toast } from "svelte-sonner";
  import { isHttpError } from "@sveltejs/kit";

  let { oncancel }: RecoveryCodeFormProps = $props();

  let status: AsyncState = $state("idle");
</script>

<form
  class="flex w-full flex-col gap-6"
  {...recover2FA.enhance(async ({ submit }) => {
    if (status === "processing") return;
    status = "processing";
    const toastId = showLoading("Checking recovery code...");
    try {
      await submit();
      const issues = recover2FA.fields.allIssues?.() || [];
      if (issues.length > 0) showWarning(issues.map((i) => i.message).join(", "));
    } catch (e) {
      const message = isHttpError(e) ? e.body?.message : String(e);
      showWarning(message || "Failed to use recovery code. Please try again.");
    } finally {
      toast.dismiss(toastId);
      status = "idle";
    }
  })}
>
  <FieldGroup>
    <div class="flex flex-col items-center gap-1 text-center">
      <h1 class="text-2xl font-bold">Use a recovery code</h1>
      <p class="text-sm text-muted-foreground">
        Enter the 16-character code you saved when you set up two-factor authentication. This turns
        two-factor authentication off so you can set it up again.
      </p>
    </div>

    <Field>
      <FieldLabel for="recovery-code">Recovery code</FieldLabel>
      <Input
        id="recovery-code"
        autocomplete="one-time-code"
        autocapitalize="characters"
        spellcheck={false}
        maxlength={16}
        {...recover2FA.fields.recoveryCode.as("text")}
        aria-invalid={recover2FA.fields.recoveryCode.issues() ? "true" : "false"}
      />
      <FieldError errors={recover2FA.fields.recoveryCode.issues()} />
    </Field>

    <Button type="submit" disabled={status === "processing"} class="min-w-32">
      {#if status === "processing"}
        <Loader class="size-4 animate-spin" />
        Checking...
      {:else}
        Use recovery code
      {/if}
    </Button>
    <Button type="button" variant="link" onclick={oncancel}>Use authenticator code instead</Button>
  </FieldGroup>
</form>
