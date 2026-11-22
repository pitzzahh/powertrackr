<script lang="ts" module>
  import type { AuthAction } from "#lib/types/auth.js";
  import type { HTMLFormAttributes } from "svelte/elements";
  import type { WithElementRef } from "#lib/index.js";
  export type AuthFormProps = WithElementRef<HTMLFormAttributes> & {
    action: AuthAction;
    /** Turnstile site key, resolved server-side from the wrangler var. */
    siteKey?: string;
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
  } from "#lib/components/ui/field/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { fieldInputProps } from "#lib/utils/field.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { cn } from "#lib/utils/style.js";
  import Password from "#lib/components/password.svelte";
  import { Loader } from "#lib/assets/icons.js";
  import { login, register } from "#lib/api/auth.remote.js";
  import { notifyResult } from "#lib/utils/notify.js";
  import TurnstileWidget from "./turnstile-widget.svelte";
  import GithubButton from "./github-button.svelte";

  let {
    action,
    siteKey,
    ref = $bindable(null),
    class: className,
    ...restProps
  }: AuthFormProps = $props();

  const id = $props.id();
  const isLogin = $derived(action === "login");
  const currentAction = $derived(isLogin ? login : register);

  let emailBusy = $state(false);
  let githubBusy = $state(false);
  let token = $state("");
  let turnstile = $state<ReturnType<typeof TurnstileWidget>>();
</script>

<form
  {...currentAction.enhance(async ({ submit, element }) => {
    if (emailBusy) return;
    emailBusy = true;
    const ok = await notifyResult({
      loading: isLogin ? "Logging you in..." : "Creating your account...",
      success: isLogin ? "Logged in successfully" : "Account created successfully",
      failure: isLogin
        ? "Failed to log you in. Please try again."
        : "Failed to create your account. Please try again.",
      run: submit,
      issues: () => currentAction.fields.allIssues(),
    });
    // Any failed submit spent the single-use Turnstile token, whatever the
    // reason (wrong password, rate limit): mint a fresh one for the retry
    if (ok) element.reset();
    else turnstile?.reset();
    emailBusy = false;
  })}
  class={cn("flex flex-col gap-6", className)}
  bind:this={ref}
  {...restProps}
>
  <FieldGroup>
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">
        {isLogin ? "Sign in" : "Create your account"}
      </h1>
      <p class="text-sm text-balance text-muted-foreground">
        {isLogin
          ? "Use the email and password you registered with."
          : "You'll add your first bill right after this."}
      </p>
    </div>
    {#if !isLogin}
      <Field>
        <FieldLabel for="name-{id}">Name</FieldLabel>
        <Input
          autofocus
          id="name-{id}"
          autocomplete="name"
          required
          {...register.fields.name.as("text")}
        />
        <FieldError errors={register.fields.name.issues()} />
      </Field>
    {/if}
    <Field>
      <FieldLabel for="email-{id}">Email</FieldLabel>
      <Input
        autofocus={isLogin}
        id="email-{id}"
        placeholder="m@example.com"
        required
        autocomplete="email"
        {...fieldInputProps(currentAction.fields.email.as("email"))}
      />
      <FieldError errors={currentAction.fields.email.issues()} />
    </Field>
    <Field>
      <div class="flex items-center">
        <FieldLabel for="password-{id}">Password</FieldLabel>
        {#if isLogin}
          <a href="?act=forgot-password" class="ms-auto text-sm underline-offset-4 hover:underline">
            Forgot your password?
          </a>
        {/if}
      </div>
      <Password
        id="password-{id}"
        required
        autocomplete={isLogin ? "current-password" : "new-password"}
        showProgress={!isLogin}
        showRequirements={!isLogin}
        {...currentAction.fields.password.as("password")}
      />
      <FieldError errors={currentAction.fields.password.issues()} />
    </Field>
    {#if !isLogin}
      <Field>
        <FieldLabel for="confirm-password-{id}">Confirm Password</FieldLabel>
        <Password
          id="confirm-password-{id}"
          autocomplete="new-password"
          required
          showProgress={true}
          showRequirements={false}
          {...register.fields.confirmPassword.as("password")}
        />
        <FieldError errors={register.fields.confirmPassword.issues()} />
      </Field>
    {/if}
    <input {...currentAction.fields.turnstileToken.as("hidden", token)} />
    <Field>
      <TurnstileWidget {siteKey} bind:token bind:this={turnstile} />
      <FieldError errors={currentAction.fields.turnstileToken.issues()} />
    </Field>
    <Field>
      <Button
        type="submit"
        disabled={emailBusy || githubBusy}
        aria-label={isLogin ? "Login to your account" : "Create your account"}
      >
        {#if emailBusy}
          <Loader class="size-5 animate-spin" />
        {:else}
          {isLogin ? "Login to your account" : "Create your account"}
        {/if}
      </Button>
    </Field>
    <FieldSeparator>Or continue with</FieldSeparator>
    <Field>
      <GithubButton
        label={isLogin ? "Login with GitHub" : "Sign up with GitHub"}
        disabled={emailBusy}
        bind:busy={githubBusy}
      />
      <FieldDescription class="text-center">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <a
          href="/auth?act={isLogin ? 'register' : 'login'}"
          class="underline underline-offset-4"
          aria-disabled={emailBusy || githubBusy}
          onclick={() => (ref as HTMLFormElement | null)?.reset()}
        >
          {isLogin ? "Sign up" : "Login"}
        </a>
      </FieldDescription>
    </Field>
  </FieldGroup>
</form>
