<script lang="ts" module>
  import type { AsyncState } from "$/types/state";
</script>

<script lang="ts">
  import { FieldGroup, Field, FieldLabel, FieldError } from "$/components/ui/field/index.js";
  import { Button } from "$/components/ui/button/index.js";
  import { Loader } from "$lib/assets/icons.js";
  import * as InputOTP from "$/components/ui/input-otp";
  import { checkpoint2FA } from "$/api/auth.remote";
  import { showLoading, showSuccess, showWarning } from "$/components/toast";
  import { toast } from "svelte-sonner";
  import { isHttpError } from "@sveltejs/kit";
  import { REGEXP_ONLY_DIGITS } from "bits-ui";

  let status: AsyncState = $state("idle");
</script>

<form
  class="flex w-full flex-col gap-6"
  {...checkpoint2FA.enhance(async ({ submit, form }) => {
    if (status === "processing") return;
    status = "processing";
    const toastId = showLoading("Verifying two-factor authentication...");
    try {
      await submit();
      const issues = checkpoint2FA.fields.allIssues?.() || [];
      if (issues.length > 0) {
        showWarning(issues.map((i) => i.message).join(", "));
      } else {
        form.reset();
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
        <InputOTP.Root
          maxlength={6}
          name="code"
          onValueChange={(value) => checkpoint2FA.fields.code.set(value)}
          pattern={REGEXP_ONLY_DIGITS}
        >
          {#snippet children({ cells })}
            <InputOTP.Group>
              {#each cells.slice(0, 3) as cell (cell)}
                <InputOTP.Slot
                  {cell}
                  aria-invalid={checkpoint2FA.fields.code.issues() ? "true" : "false"}
                />
              {/each}
            </InputOTP.Group>
            <InputOTP.Separator />
            <InputOTP.Group>
              {#each cells.slice(3, 6) as cell (cell)}
                <InputOTP.Slot
                  {cell}
                  aria-invalid={checkpoint2FA.fields.code.issues() ? "true" : "false"}
                />
              {/each}
            </InputOTP.Group>
          {/snippet}
        </InputOTP.Root>
      </div>
      <FieldError errors={checkpoint2FA.fields.code.issues()} />
    </Field>

    <Button
      type="submit"
      disabled={(checkpoint2FA.fields.code.value() &&
        checkpoint2FA.fields.code.value().length !== 6) ||
        status === "processing"}
      class="min-w-32"
    >
      {#if status === "processing"}
        <Loader class="size-4 animate-spin" />
        Verifying...
      {:else}
        Verify
      {/if}
    </Button>
  </FieldGroup>
</form>
