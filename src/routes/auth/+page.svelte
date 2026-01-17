<script lang="ts">
  import {
    AuthForm,
    VerifyEmailForm,
    Setup2FAForm,
    ForgotPasswordForm,
    AuthBackground,
  } from "$routes/auth/(components)";
  import Logo from "$/components/logo.svelte";
  import { Button } from "$/components/ui/button/index.js";
  import { Moon, Sun } from "$/assets/icons";
  import { toggleMode } from "mode-watcher";

  let { data } = $props();
</script>

<div class="grid min-h-svh lg:grid-cols-2">
  <div class="flex flex-col gap-4 p-6 md:p-10">
    <div class="flex justify-center gap-2 md:justify-between">
      <Logo variant="ghost" class="px-0" />
      <Button onclick={toggleMode} variant="secondary" size="icon">
        <Sun
          class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all! dark:scale-0 dark:-rotate-90"
        />
        <Moon
          class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all! dark:scale-100 dark:rotate-0"
        />
        <span class="sr-only">Toggle theme</span>
      </Button>
    </div>
    <div class="flex flex-1 items-center justify-center">
      <div class="w-full max-w-xs">
        {#if ["login", "register"].includes(data.action)}
          <AuthForm action={data.action} />
        {:else if data.action === "verify-email"}
          <VerifyEmailForm />
        {:else if data.action === "2fa-setup"}
          <Setup2FAForm />
        {:else if data.action === "forgot-password"}
          <ForgotPasswordForm />
        {/if}
      </div>
    </div>
  </div>
  <div class="relative hidden bg-muted lg:block">
    <AuthBackground />
  </div>
</div>
