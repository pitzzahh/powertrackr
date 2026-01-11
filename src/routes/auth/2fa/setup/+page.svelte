<script lang="ts">
  import Setup2FAForm from "$lib/components/setup-2fa-form.svelte";
  import Logo from "$/components/logo.svelte";
  import hero from "$/assets/illustrations/hero.svg";
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
        <Setup2FAForm />
      </div>
    </div>
  </div>
  <div class="relative hidden bg-muted lg:block">
    <img src={hero} alt="placeholder" class="absolute inset-0 h-full w-full object-cover" />
  </div>
</div>
