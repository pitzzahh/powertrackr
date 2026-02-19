<script lang="ts" module>
  import type { AsyncState } from "$/types/state";
  import type { HTMLFormAttributes } from "svelte/elements";
  import type { WithElementRef } from "$/index";

  export type VerifyEmailFormProps = WithElementRef<HTMLFormAttributes>;

  type VerifyEmailFormState = {
    status: AsyncState;
    countdown: number;
    cooldownTime: number | undefined;
    timer: ReturnType<typeof setInterval> | undefined;
  };
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
  import { verifyEmail } from "$/api/auth.remote";
  import { toast } from "svelte-sonner";
  import { isHttpError } from "@sveltejs/kit";
  import { signout } from "$/api/auth.remote";
  import { resendVerification } from "$/api/email.remote";
  import {
    showError,
    showInspectorWarning,
    showLoading,
    showSuccess,
    showWarning,
  } from "$/components/toast";

  let { ref = $bindable(null), class: className, ...restProps }: VerifyEmailFormProps = $props();

  let { status, countdown, cooldownTime, timer }: VerifyEmailFormState = $state({
    status: "idle",
    countdown: 0,
    cooldownTime: undefined,
    timer: undefined,
  });

  const id = $props.id();

  $effect(() => {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const cooldownCookie = cookies.find((c) => c.startsWith("resend_cooldown="));
    if (cooldownCookie) {
      const value = cooldownCookie.split("=")[1];
      cooldownTime = parseInt(value);
      const now = Date.now();
      countdown = Math.max(0, Math.ceil((cooldownTime - now) / 1000));
      if (countdown > 0) {
        timer = setInterval(() => {
          if (cooldownTime) {
            const now = Date.now();
            countdown = Math.max(0, Math.ceil((cooldownTime - now) / 1000));
            if (countdown <= 0) {
              clearInterval(timer);
              timer = undefined;
              cooldownTime = undefined;
              document.cookie = "resend_cooldown=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            }
          }
        }, 1000);
      }
    }
    return () => {
      clearInterval(timer);
      status = "idle";
    };
  });
</script>

<form
  {...verifyEmail.enhance(async ({ submit }) => {
    if (countdown > 0) {
      showInspectorWarning();
      return;
    }
    status = "processing";
    const toastId = showLoading("Verifying your email...");
    try {
      await submit();
      const issues = verifyEmail.fields.allIssues?.() || [];
      if (issues.length > 0) {
        showWarning(issues.map((i) => i.message).join(", "));
      } else {
        showSuccess("Email verified successfully");
      }
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
        autofocus
        autocomplete="one-time-code"
        class="text-center font-mono tracking-widest tabular-nums"
        spellcheck={false}
        oninput={(e) => verifyEmail.fields.code.set(e.currentTarget.value.toUpperCase())}
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
        disabled={status === "processing" || countdown > 0}
        aria-label="Resend verification code"
        style="opacity: {countdown > 0 ? 0.3 + ((60 - countdown) / 60) * 0.7 : 1}"
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
            if (res?.success && res.sent) {
              cooldownTime = Date.now() + 60000; // 60 seconds
              document.cookie = `resend_cooldown=${cooldownTime}; path=/; max-age=60;`;
              countdown = 60;
              timer = setInterval(() => {
                if (cooldownTime) {
                  const now = Date.now();
                  countdown = Math.max(0, Math.ceil((cooldownTime - now) / 1000));
                  if (countdown <= 0) {
                    clearInterval(timer);
                    timer = undefined;
                    cooldownTime = undefined;
                    document.cookie =
                      "resend_cooldown=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  }
                }
              }, 1000);
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
        {:else if countdown > 0}
          Resend in {countdown}s
        {:else}
          Resend Code
        {/if}
      </Button>
      <FieldDescription class="text-center">
        Didn't receive the code? Check your spam folder or resend {#if countdown > 0}
          in {countdown}s{/if}.
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
