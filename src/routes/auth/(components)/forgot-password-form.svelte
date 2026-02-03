<script lang="ts" module>
  import type { AsyncState } from "$/types/state";
  import type { HTMLFormAttributes } from "svelte/elements";
  import type { WithElementRef } from "$/index";

  export type ForgotPasswordFormProps = WithElementRef<HTMLFormAttributes>;

  type ForgotPasswordFormState = {
    status: AsyncState;
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
  import { forgotPassword } from "$/api/auth.remote";
  import { toast } from "svelte-sonner";
  import { isHttpError } from "@sveltejs/kit";
  import { showError, showLoading, showSuccess } from "$/components/toast";

  let { ref = $bindable(null), class: className, ...restProps }: ForgotPasswordFormProps = $props();

  let { status }: ForgotPasswordFormState = $state({
    status: "idle",
  });

  const id = $props.id();
</script>

<form
  {...forgotPassword.enhance(async ({ submit }) => {
    status = "processing";
    const toastId = showLoading("Sending password reset email...");
    try {
      await submit();
      showSuccess("If an account with that email exists, we've sent you a password reset link.");
    } catch (e) {
      const message = isHttpError(e) ? e.body.message : String(e);
      console.log({ e });
      showError(message || "Failed to send password reset email. Please try again.");
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
      <h1 class="text-2xl font-bold">Forgot your password?</h1>
      <p class="text-sm text-balance text-muted-foreground">
        Enter your email address and we'll send you a link to reset your password.
      </p>
    </div>
    <Field>
      <FieldLabel for="email-{id}">Email</FieldLabel>
      <Input
        autofocus
        id="email-{id}"
        placeholder="m@example.com"
        required
        autocomplete="email"
        {...forgotPassword.fields.email.as("email")}
      />
      <FieldError errors={forgotPassword.fields.email.issues()} />
    </Field>
    <Field>
      <Button
        type="submit"
        disabled={status === "processing"}
        aria-label="Send password reset email"
      >
        {#if status === "processing"}
          <Loader class="size-5 animate-spin" />
        {:else}
          <MessageCircle class="size-5" />
          Send Reset Email
        {/if}
      </Button>
      <FieldDescription class="text-center">
        Remember your password? <a href="?act=login" class="underline underline-offset-4">Login</a>
      </FieldDescription>
    </Field>
  </FieldGroup>
</form>
