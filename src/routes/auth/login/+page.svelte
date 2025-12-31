<script lang="ts">
  import LoginForm from "$lib/components/login-form.svelte";
  import Logo from "$/components/logo.svelte";
  import hero from "$/assets/illustrations/hero.svg";
</script>

<div class="grid min-h-svh lg:grid-cols-2">
  <div class="flex flex-col gap-4 p-6 md:p-10">
    <div class="flex justify-center gap-2 md:justify-start">
      <Logo variant="ghost" class="px-0" />
    </div>
    <div class="flex flex-1 items-center justify-center">
      <div class="w-full max-w-xs">
        <LoginForm />
      </div>
    </div>
  </div>
  <div class="bg-muted relative hidden lg:block">
    <img
      src={hero}
      alt="placeholder"
      class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
    />
  </div>
</div>
