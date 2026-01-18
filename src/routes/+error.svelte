<script lang="ts">
  import { page } from "$app/state";
  import Logo from "$/components/logo.svelte";
  import { Button } from "$/components/ui/button/index.js";
  import { Sun, Moon, ChevronLeft } from "$/assets/icons";
  import { toggleMode } from "mode-watcher";
  import { goto } from "$app/navigation";
  import { AuthBackground } from "$routes/auth/(components)";
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
      <div class="w-full max-w-xs text-center">
        <h1 class="mb-4 text-2xl font-bold">{page.status}</h1>
        <p class="mb-6">
          {page.error?.message || "An unexpected error occurred."}
        </p>
        <Button onclick={() => goto("/auth")} variant="default">
          <ChevronLeft class="size-4" />
          Back to Login
        </Button>
      </div>
    </div>
  </div>
  <div class="relative hidden bg-muted lg:block">
    <AuthBackground />
  </div>
</div>
