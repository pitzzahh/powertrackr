<script lang="ts">
  import Logo from "$/components/logo.svelte";
  import { Button, buttonVariants } from "$/components/ui/button";
  import * as Sheet from "$lib/components/ui/sheet/index.js";
  import { Menu, PhilippinePeso } from "$/assets/icons";
  import SidebarContent from "$routes/(components)/sidebar-content.svelte";
  import { cn } from "$/utils/style";
  import { MoonIcon, SunIcon } from "@lucide/svelte";
  import { toggleMode } from "mode-watcher";
  import { scale } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  let { open, quickActions } = $state({
    open: false,
    quickActions: [
      {
        icon: PhilippinePeso,
        content: "New Bill",
        action: () => {
          // TODO: Implement new bill action, e.g., open a modal
        },
      },
    ],
  });
</script>

<Sheet.Root bind:open>
  <header
    class="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background/10 backdrop-blur-[120px]"
  >
    <div class="flex items-center gap-4 w-full md:justify-between">
      <Sheet.Trigger
        class={buttonVariants({
          variant: "outline",
          size: "icon",
          className: "md:hidden",
        })}
      >
        <Menu class="h-4 w-4" />
        <span class="sr-only">Open sidebar</span>
      </Sheet.Trigger>
      {@render logo({ className: "mx-auto w-1/2 md:w-fit md:m-0 md:pl-0!" })}

      <div class="flex items-center justify-center gap-4">
        <div class="items-center justify-center gap-2 hidden md:flex">
          {#each quickActions as quickAction, index (quickAction.content)}
            {@const Icon = quickAction.icon}
            <span
              in:scale={{
                duration: 250,
                delay: index * 150,
                easing: cubicInOut,
                start: 0.8,
              }}
            >
              <Button><Icon /> {quickAction.content}</Button>
            </span>
          {/each}
        </div>

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
    </div>
  </header>

  <Sheet.Content side="left" class="bg-muted p-4 flex flex-col h-full w-full">
    {@render logo({ className: "py-6 w-fit mx-auto" })}
    <SidebarContent bind:open />
  </Sheet.Content>
</Sheet.Root>

{#snippet logo({ className }: { className?: string } | undefined = {})}
  <Logo variant="ghost" class={cn("px-0", className)} />
{/snippet}
