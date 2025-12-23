<script lang="ts">
  import { Button, buttonVariants } from "$/components/ui/button";
  import { LogOut, Blocks, Zap, History } from "@lucide/svelte";
  import * as AlertDialog from "$/components/ui/alert-dialog/index.js";
  import SettingsDialog from "./settings-dialog.svelte";

  const navItems = $state([
    { icon: Blocks, label: "DASHBOARD", active: true },
    { icon: Zap, label: "CONSUMPTION", active: false },
    { icon: History, label: "HISTORY", active: false },
  ]);
</script>

<aside
  class="sticky rounded top-24 h-[calc(100vh-8rem)] md:w-48 lg:w-54 bg-muted hidden md:flex flex-col p-4 overflow-y-auto"
>
  <nav class="flex flex-col gap-8">
    {#each navItems as item (item.label)}
      {@const Icon = item.icon}
      <Button
        data-active={item.active}
        variant="link"
        onclick={() => {
          item.active = true;
          navItems.forEach((navItem) => {
            if (navItem.label !== item.label) {
              navItem.active = false;
            }
          });
        }}
        class="flex items-center gap-4 no-underline! cursor-pointer data-[active=false]:hover:text-foreground data-[active=false]:text-muted-foreground w-full justify-start"
      >
        <Icon class="size-6" />
        <span class="text-sm font-medium tracking-wide">{item.label}</span>
      </Button>
    {/each}
  </nav>

  <div class="mt-auto pt-8 p-x border-t border-border flex flex-col gap-8">
    <SettingsDialog />
    <AlertDialog.Root>
      <AlertDialog.Trigger
        class={buttonVariants({
          variant: "hover-destructive",
          class:
            "flex items-center gap-4 no-underline! cursor-pointer w-full justify-start",
        })}
      >
        <LogOut class="h-6 w-6" />
        <span class="text-sm font-medium tracking-wide">LOGOUT</span>
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
          <AlertDialog.Description>
            Any unsaved changes will be lost. You can log back in at any time.
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
          <AlertDialog.Action>Logout</AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog.Root>
  </div>
</aside>

<!-- <style>
  * {
    border: 1px solid red;
  }
</style> -->
