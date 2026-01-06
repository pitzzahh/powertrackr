<script lang="ts" module>
  import type { Snippet } from "svelte";
  import { Icon } from "@lucide/svelte";

  export type HeaderProps = {
    user: App.Locals["user"];
  };

  type HeaderState = {
    openMenu: boolean;
    quickActions: {
      icon: typeof Icon;
      label: string;
      content: (callback: (valid: boolean) => void) => ReturnType<Snippet<[]>>;
      callback: (valid: boolean) => void;
    }[];
  };
</script>

<script lang="ts">
  import Logo from "$/components/logo.svelte";
  import { Button, buttonVariants } from "$/components/ui/button";
  import * as Sheet from "$lib/components/ui/sheet/index.js";
  import { Menu, PhilippinePeso, Moon, Sun } from "$/assets/icons";
  import SidebarContent from "$routes/(components)/sidebar-content.svelte";
  import { cn } from "$/utils/style";
  import { toggleMode } from "mode-watcher";
  import { scale } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import BillingInfoForm from "$routes/history/(components)/billing-info-form.svelte";
  import { ScrollArea } from "$/components/ui/scroll-area";
  import { toast } from "svelte-sonner";

  let { user }: HeaderProps = $props();

  let { openMenu, quickActions }: HeaderState = $state({
    openMenu: false,
    quickActions: [
      {
        icon: PhilippinePeso,
        label: "New Bill",
        content: newBill,
        callback: (valid) => {
          let message = valid
            ? "Bill added successfully!"
            : "Failed to add bill. Please check the form for errors.";
          if (valid) toast.success(message);
          else toast.error(message);
        },
      },
    ],
  });
</script>

<Sheet.Root bind:open={openMenu}>
  <header
    class="absolute top-0 left-0 right-0 z-5 flex items-center justify-between p-4 backdrop-blur-xs"
  >
    <div class="flex items-center gap-4 w-full md:justify-between">
      <Sheet.Trigger
        class={buttonVariants({
          variant: "outline",
          size: "icon",
          className: "lg:hidden",
        })}
      >
        <Menu class="h-4 w-4" />
        <span class="sr-only">Open sidebar</span>
      </Sheet.Trigger>
      {@render logo({
        className: "mx-auto w-1/2 md:w-fit md:m-0 md:pl-0!",
      })}

      <div class="flex items-center justify-center gap-4">
        <div class="items-center justify-center gap-2 hidden md:flex">
          {#each quickActions as quickAction, index (quickAction.label)}
            {@const Icon = quickAction.icon}
            <span
              in:scale={{
                duration: 250,
                delay: index * 150,
                easing: cubicInOut,
                start: 0.8,
              }}
            >
              <Sheet.Root>
                <Sheet.Trigger class={buttonVariants()}>
                  <Icon class="size-4" />
                  <span>{quickAction.label}</span>
                  <span class="sr-only">
                    {quickAction.label}
                  </span>
                </Sheet.Trigger>
                <Sheet.Portal>
                  <Sheet.Content class="md:min-w-[60%] w-full" side="left">
                    <Sheet.Header>
                      <Sheet.Title>Add new Bill</Sheet.Title>
                      <Sheet.Description>Enter billing info</Sheet.Description>
                    </Sheet.Header>
                    {@render quickAction.content(quickAction.callback)}
                  </Sheet.Content>
                </Sheet.Portal>
              </Sheet.Root>
            </span>
          {/each}
        </div>

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
    </div>
  </header>

  <Sheet.Content side="left" class="bg-muted p-4 flex flex-col h-full w-full">
    {@render logo({ className: "py-6 w-fit mx-auto" })}
    <SidebarContent bind:open={openMenu} {user} isMobileSheet={true} />
  </Sheet.Content>
</Sheet.Root>

{#snippet logo({ className }: { className?: string } | undefined = {})}
  <Logo variant="ghost" class={cn("px-0", className)} />
{/snippet}

{#snippet newBill(callback: HeaderState["quickActions"][0]["callback"])}
  <ScrollArea class="overflow-y-auto h-[calc(100vh-50px)] pr-2.5">
    <div class="space-y-4 p-4">
      <BillingInfoForm action="add" {callback} />
    </div>
  </ScrollArea>
{/snippet}
