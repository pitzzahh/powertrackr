<script lang="ts" module>
  import type { Status } from "$/types/state";
  import type { HTMLFormAttributes } from "svelte/elements";
  import type { WithElementRef } from "..";
  export type AuthFormProps = WithElementRef<HTMLFormAttributes> & {
    action: "login" | "register";
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
  } from "$/components/ui/field/index.js";
  import { Input } from "$/components/ui/input/index.js";
  import { Button } from "$/components/ui/button/index.js";
  import { cn } from "$/utils/style.js";
  import * as Password from "$/components/password";
  import { Github, Loader } from "$/assets/icons";

  let {
    action,
    ref = $bindable(null),
    class: className,
    ...restProps
  }: AuthFormProps = $props();

  let { status }: AuthFormState = $state({
    status: "idle",
  });

  const id = $props.id();
</script>

<form
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
      <p class="text-muted-foreground text-sm text-balance">
        {#if action === "login"}
          Enter your email and password to access your account.
        {:else}
          Fill in the details below to create your account.
        {/if}
      </p>
    </div>
    <Field>
      <FieldLabel for="email-{id}">Email</FieldLabel>
      <Input
        id="email-{id}"
        type="email"
        placeholder="m@example.com"
        required
      />
    </Field>
    <Field>
      <div class="flex items-center">
        <FieldLabel for="password-{id}">Password</FieldLabel>
        {#if action === "login"}
          <a
            href="##"
            class="ms-auto text-sm underline-offset-4 hover:underline"
          >
            Forgot your password?
          </a>
        {/if}
      </div>
      <Password.Root
        id="password-{id}"
        enableStrengthCheck={action === "register"}
      >
        <Password.Input required>
          <Password.ToggleVisibility />
        </Password.Input>
        {#if action === "register"}
          <Password.Strength />
        {/if}
      </Password.Root>
    </Field>
    {#if action === "register"}
      <Field>
        <div class="flex items-center">
          <FieldLabel for="confirm-password-{id}">Confirm Password</FieldLabel>
        </div>
        <Password.Root id="confirm-password-{id}">
          <Password.Input required>
            <Password.ToggleVisibility />
          </Password.Input>
          <Password.Strength />
        </Password.Root>
      </Field>{/if}
    <Field>
      <Button type="submit">
        {action === "login" ? "Login to your account" : "Create your account"}
      </Button>
    </Field>
    <FieldSeparator>Or continue with</FieldSeparator>
    <Field>
      <Button
        variant="outline"
        type="button"
        href="/auth/github"
        onclick={() => (status = "processing")}
      >
        {#if status === "processing"}
          <Loader class="animate-spin size-5" />
        {:else}
          <Github />
          {action === "login" ? "Login with Github" : "Sign up with GitHub"}
        {/if}
      </Button>
      <FieldDescription class="text-center">
        {action === "login"
          ? "Don't have an account? "
          : "Already have an account? "}
        <a
          href="/auth?act={action === 'login' ? 'register' : 'login'}"
          class="underline underline-offset-4"
        >
          {action === "login" ? "Sign up" : "Login"}
        </a>
      </FieldDescription>
    </Field>
  </FieldGroup>
</form>
