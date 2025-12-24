<script lang="ts">
  import Logo from "$/components/logo.svelte";
  import { Button } from "$/components/ui/button";
  import * as Sheet from "$lib/components/ui/sheet/index.js";
  import { Menu } from "@lucide/svelte";
  import SidebarContent from "$routes/(components)/sidebar-content.svelte";
  import { cn } from "$/utils/style";
  import { MoonIcon, SunIcon } from "@lucide/svelte";
  import { toggleMode } from "mode-watcher";
  let { open } = $state({
    open: false,
  });
</script>

<Sheet.Root bind:open>
  <header
    class="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background/10 backdrop-blur-[120px]"
  >
    <div class="flex items-center gap-4 w-full">
      <Sheet.Trigger class="md:hidden">
        <Button variant="outline" size="icon">
          <Menu class="h-4 w-4" />
          <span class="sr-only">Open sidebar</span>
        </Button>
      </Sheet.Trigger>
      {@render logo({ className: "mx-auto w-1/2" })}
      <Button onclick={toggleMode} variant="secondary" size="icon">
        <SunIcon
          class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all! dark:scale-0 dark:-rotate-90"
        />
        <MoonIcon
          class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all! dark:scale-100 dark:rotate-0"
        />
        <span class="sr-only">Toggle theme</span>
      </Button>
    </div>
  </header>

  <Sheet.Content side="left" class="bg-muted p-4 flex flex-col h-full w-full">
    {@render logo({ className: "py-6" })}
    <SidebarContent />
  </Sheet.Content>
</Sheet.Root>

{#snippet logo({ className }: { className?: string } | undefined = {})}
  <Logo variant="ghost" class={cn("px-0", className)} />
{/snippet}
