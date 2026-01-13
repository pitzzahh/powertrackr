<script lang="ts" module>
  import type { Status } from "$/types/state";
  import type { HTMLFormAttributes } from "svelte/elements";
  import type { WithElementRef } from "$/index";
  export type AuthFormProps = WithElementRef<HTMLFormAttributes> & {
    action: "login" | "register" | "verify-email" | "2fa-setup" | "reset-password";
  };

  type AuthFormState = {
    status: Status;
  };
</script>

<script lang="ts">
  import {
    FieldGroup,
    Field,
    FieldLabel,
    FieldDescription,
    FieldSeparator,
    FieldError,
  } from "$/components/ui/field/index.js";
  import { Input } from "$/components/ui/input/index.js";
  import { Button } from "$/components/ui/button/index.js";
  import { cn } from "$/utils/style.js";
  import * as Password from "$/components/password";
  import { Github, Loader } from "$/assets/icons";
  import { onDestroy } from "svelte";
  import { login, register } from "$/api/auth.remote";
  import { toast } from "svelte-sonner";
  import { isHttpError } from "@sveltejs/kit";
  import { loginWithGithub } from "$/api/github.remote";
  import { showError, showLoading, showSuccess } from "$/components/toast";

  let { action, ref = $bindable(null), class: className, ...restProps }: AuthFormProps = $props();

  let { currentAction } = $derived({
    currentAction: action === "login" ? login : register,
  });

  let { status }: AuthFormState = $state({
    status: "idle",
  });

  const id = $props.id();

  onDestroy(() => (status = "idle"));
</script>

<form
  {...currentAction.enhance(async ({ submit }) => {
    status = "processing";
    const toastId = showLoading(
      action === "login" ? "Logging you in..." : "Creating your account..."
    );
    try {
      await submit();
      showSuccess(action === "login" ? "Logged in successfully" : "Account created successfully");
    } catch (e) {
      const message = isHttpError(e) ? e.body.message : String(e);
      console.log({ e });
      showError(
        message ||
          (action === "login"
            ? "Failed to log you in. Please try again."
            : "Failed to create your account. Please try again.")
      );
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
      <h1 class="text-2xl font-bold">
        {#if action === "login"}
          Welcome back, you've been missed!
        {:else}
          Create an account to get started!
        {/if}
      </h1>
      <p class="text-sm text-balance text-muted-foreground">
        {#if action === "login"}
          Enter your email and password to access your account.
        {:else}
          Fill in the details below to create your account.
        {/if}
      </p>
    </div>
    {#if action === "register"}
      <Field>
        <FieldLabel for="name-{id}">Name</FieldLabel>
        <Input id="name-{id}" autocomplete="name" required {...register.fields.name.as("text")} />
        <FieldError errors={register.fields.name.issues()} />
      </Field>
    {/if}
    <Field>
      <FieldLabel for="email-{id}">Email</FieldLabel>
      <Input
        id="email-{id}"
        placeholder="m@example.com"
        required
        autocomplete="email"
        {...currentAction.fields.email.as("email")}
      />
      <FieldError errors={currentAction.fields.email.issues()} />
    </Field>
    <Field>
      <div class="flex items-center">
        <FieldLabel for="password-{id}">Password</FieldLabel>
        {#if action === "login"}
          <a href="##" class="ms-auto text-sm underline-offset-4 hover:underline">
            Forgot your password?
          </a>
        {/if}
      </div>
      <Password.Root enableStrengthCheck={action === "register"}>
        <Password.Input
          id="password-{id}"
          autocomplete="current-password"
          {...currentAction.fields.password.as("password")}
        >
          <Password.ToggleVisibility />
        </Password.Input>
        {#if action === "register"}
          <Password.Strength />
        {/if}
      </Password.Root>
      <FieldError errors={currentAction.fields.password.issues()} />
    </Field>
    {#if action === "register"}
      <Field>
        <div class="flex items-center">
          <FieldLabel for="confirm-password-{id}">Confirm Password</FieldLabel>
        </div>
        <Password.Root>
          <Password.Input
            id="confirm-password-{id}"
            required
            autocomplete="new-password"
            {...register.fields.confirmPassword.as("password")}
          >
            <Password.ToggleVisibility />
          </Password.Input>
          <Password.Strength />
        </Password.Root>
        <FieldError errors={register.fields.confirmPassword.issues()} />
      </Field>
    {/if}
    <Field>
      <Button
        type="submit"
        disabled={status === "processing"}
        aria-label={action === "login" ? "Login to your account" : "Create your account"}
      >
        {#if status === "processing"}
          <Loader class="size-5 animate-spin" />
        {:else}
          {action === "login" ? "Login to your account" : "Create your account"}
        {/if}
      </Button>
    </Field>
    <FieldSeparator>Or continue with</FieldSeparator>
    <Field>
      <Button
        variant="outline"
        disabled={status === "processing"}
        aria-label={action === "login" ? "Login with GitHub" : "Sign up with GitHub"}
        onclick={async () => {
          status = "processing";
          const toastId = showLoading(
            action === "login" ? "Logging in with GitHub" : "Creating Account with GitHub"
          );
          try {
            const redirect = await loginWithGithub().then(({ redirect }) => redirect);
            if (redirect) {
              toast.dismiss(toastId);
              window.location.href = redirect;
            }
          } catch (error) {
            const message = isHttpError(error) ? error.body.message : String(error);
            showError(
              message ||
                (action === "login"
                  ? "Failed to log you in. Please try again."
                  : "Failed to create your account. Please try again.")
            );
          } finally {
            status = "idle";
            toast.dismiss(toastId);
          }
        }}
      >
        {#if status === "processing"}
          <Loader class="size-5 animate-spin" />
        {:else}
          <Github />
          {action === "login" ? "Login with GitHub" : "Sign up with GitHub"}
        {/if}
      </Button>
      <FieldDescription class="text-center">
        {action === "login" ? "Don't have an account? " : "Already have an account? "}
        <a
          href="/auth?act={action === 'login' ? 'register' : 'login'}"
          class="underline underline-offset-4"
          onclick={() => (status = "idle")}
        >
          {action === "login" ? "Sign up" : "Login"}
        </a>
      </FieldDescription>
    </Field>
  </FieldGroup>
</form>
