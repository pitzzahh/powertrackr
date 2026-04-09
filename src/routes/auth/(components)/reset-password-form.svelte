<script lang="ts" module>
  import type { AsyncState } from "$/types/state";
  import type { HTMLFormAttributes } from "svelte/elements";
  import type { WithElementRef } from "$/index";

  export type ResetPasswordFormProps = WithElementRef<HTMLFormAttributes> & {
    code: string;
  };

  type ResetPasswordFormState = {
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
  import Password from "$/components/password.svelte";
  import { Loader, Lock } from "$/assets/icons";
  import { resetPassword } from "$/api/auth.remote";
  import { toast } from "svelte-sonner";
  import { isHttpError } from "@sveltejs/kit";
  import { showError, showLoading, showSuccess } from "$/components/toast";

  let {
    code,
    ref = $bindable(null),
    class: className,
    ...restProps
  }: ResetPasswordFormProps = $props();

  let { status }: ResetPasswordFormState = $state({
    status: "idle",
  });

  const id = $props.id();
</script>

<form
  {...resetPassword.enhance(async ({ submit }) => {
    status = "processing";
    const toastId = showLoading("Resetting your password...");
    try {
      await submit();
      showSuccess("Password reset successfully. You can now log in with your new password.");
    } catch (e) {
      const message = isHttpError(e) ? e.body.message : String(e);
      console.log({ e });
      showError(message || "Failed to reset password. Please try again.");
    } finally {
      toast.dismiss(toastId);
      status = "idle";
    }
  })}
  class={["flex flex-col gap-6", className]}
  bind:this={ref}
  {...restProps}
>
  <FieldGroup>
    <div class="flex flex-col items-center gap-1 text-center">
      <h1 class="text-2xl font-bold">Reset your password</h1>
      <p class="text-sm text-balance text-muted-foreground">
        Enter the code from your email and your new password.
      </p>
    </div>
    <Field>
      <FieldLabel for="code-{id}">Reset Code</FieldLabel>
      <Input
        id="code-{id}"
        autofocus
        placeholder="Enter reset code"
        required
        autocomplete="one-time-code"
        class="text-center font-mono tracking-widest tabular-nums"
        spellcheck={false}
        {...resetPassword.fields.code.as("text", code)}
      />
      <FieldError errors={resetPassword.fields.code.issues()} />
    </Field>
    <Field>
      <FieldLabel for="password-{id}">New Password</FieldLabel>
      <Password
        id="password-{id}"
        required
        autocomplete="new-password"
        showProgress={true}
        showRequirements={true}
        {...resetPassword.fields._password.as("password")}
      />
      <FieldError errors={resetPassword.fields._password.issues()} />
    </Field>
    <Field>
      <FieldLabel for="confirm-password-{id}">Confirm New Password</FieldLabel>
      <Password
        id="confirm-password-{id}"
        required
        autocomplete="new-password"
        showProgress={true}
        showRequirements={false}
        {...resetPassword.fields._confirmPassword.as("password")}
      />
      <FieldError errors={resetPassword.fields._confirmPassword.issues()} />
    </Field>
    <Field>
      <Button type="submit" disabled={status === "processing"} aria-label="Reset password">
        {#if status === "processing"}
          <Loader class="size-5 animate-spin" />
        {:else}
          <Lock class="size-5" />
          Reset Password
        {/if}
      </Button>
      <FieldDescription class="text-center">
        Remember your password? <a href="?act=login" class="underline underline-offset-4">Login</a>
      </FieldDescription>
    </Field>
  </FieldGroup>
</form>
