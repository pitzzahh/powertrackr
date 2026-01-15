<script lang="ts" module>
  import type { Status } from "$/types/state";
  import type { HTMLFormAttributes } from "svelte/elements";
  import type { WithElementRef } from "$/index";

  export type VerifyEmailFormProps = WithElementRef<HTMLFormAttributes>;
</script>

<script lang="ts">
  import {
    FieldGroup,
    Field,
    FieldLabel,
    FieldDescription,
    FieldError,
  } from "$/components/ui/field/index.js";
  import { Input } from "$/components/ui/input/index.js";
  import { Button } from "$/components/ui/button/index.js";
  import { cn } from "$/utils/style.js";
  import { Loader, MessageCircle } from "$/assets/icons";
  import { onDestroy } from "svelte";
  import { verifyEmail } from "$/api/auth.remote";
  import { toast } from "svelte-sonner";
  import { isHttpError } from "@sveltejs/kit";
  import { signout } from "$/api/auth.remote";
  import { resendVerification } from "$/api/email.remote";
  import { showError, showLoading, showSuccess } from "$/components/toast";

  let { ref = $bindable(null), class: className, ...restProps }: VerifyEmailFormProps = $props();

  let { status }: { status: Status } = $state({
    status: "idle",
  });

  const id = $props.id();

  onDestroy(() => (status = "idle"));
</script>

<form
  {...verifyEmail.enhance(async ({ submit }) => {
    status = "processing";
    const toastId = showLoading("Verifying your email...");
    try {
      await submit();
      showSuccess("Email verified successfully");
    } catch (e) {
      const message = isHttpError(e) ? e.body.message : String(e);
      console.log({ e });
      showError(message || "Failed to verify email. Please try again.");
    } finally {
      toast.dismiss(toastId);
      status = "idle";
    }
  })}
  class={cn("flex flex-col gap-6", className)}
  bind:this={ref}
  {...restProps}
>
  <FieldGroup>
    <div class="flex flex-col items-center gap-1 text-center">
      <h1 class="text-2xl font-bold">Verify your email</h1>
      <p class="text-sm text-balance text-muted-foreground">
        Enter the verification code sent to your email address.
      </p>
    </div>
    <Field>
      <FieldLabel for="code-{id}">Verification Code</FieldLabel>
      <Input
        id="code-{id}"
        placeholder="Enter code"
        required
        autocomplete="one-time-code"
        class="text-center font-mono tracking-widest tabular-nums"
        maxlength={6}
        oninput={(e) => verifyEmail.fields.code.set(e.currentTarget.value.replace(/\D/g, ""))}
        {...verifyEmail.fields.code.as("text")}
      />
      <FieldError errors={verifyEmail.fields.code.issues()} />
    </Field>
    <Field>
      <Button type="submit" disabled={status === "processing"} aria-label="Verify email">
        {#if status === "processing"}
          <Loader class="size-5 animate-spin" />
        {:else}
          <MessageCircle class="size-5" />
          Verify Email
        {/if}
      </Button>
    </Field>
    <Field>
      <Button
        variant="outline"
        disabled={status === "processing"}
        aria-label="Resend verification code"
        onclick={async () => {
          status = "processing";
          const toastId = showLoading("Resending verification code...");
          try {
            const res = await resendVerification();
            if (res?.success) {
              if (res.alreadyVerified) {
                showSuccess("Email already verified");
              } else if (res.sent) {
                showSuccess("Verification code sent");
              } else {
                showError("Failed to send verification code. Please try again.");
              }
            } else {
              showError("Failed to resend code. Please try again.");
            }
          } catch (e) {
            const message = isHttpError(e) ? e.body.message : String(e);
            showError(message || "Failed to resend code. Please try again.");
          } finally {
            toast.dismiss(toastId);
            status = "idle";
          }
        }}
      >
        {#if status === "processing"}
          <Loader class="size-5 animate-spin" />
        {:else}
          Resend Code
        {/if}
      </Button>
      <FieldDescription class="text-center">
        Didn't receive the code? Check your spam folder or resend.
      </FieldDescription>
    </Field>
  </FieldGroup>
</form>

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
