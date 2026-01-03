<script lang="ts" module>
  import type { Status } from "$/types/state";

  type SidebarContentState = {
    status: Status;
  };
</script>

<script lang="ts">
  import { Button, buttonVariants } from "$/components/ui/button";
  import { LogOut } from "@lucide/svelte";
  import * as AlertDialog from "$/components/ui/alert-dialog/index.js";
  import SettingsDialog from "./settings-dialog.svelte";
  import { sidebarStore } from "$lib/stores/sidebar.svelte";
  import { Separator } from "$/components/ui/separator";
  import { pendingFetchContext } from "$/context";
  import { signout } from "$/remotes/auth.remote";
  import { Loader } from "$/assets/icons";
  import { page } from "$app/state";
  import { onDestroy } from "svelte";

  let {
    open = $bindable(false),
  }: {
    open: boolean;
  } = $props();

  let { status }: SidebarContentState = $state({
    status: "idle",
  });

  const pendingFetches = pendingFetchContext.get();

  onDestroy(() => {
    sidebarStore.navItems = sidebarStore.navItems.map((navItem) => ({
      ...navItem,
      active: false,
    }));
  });
</script>

<nav class="flex flex-col gap-8">
  {#each sidebarStore.navItems as item (item.label)}
    {@const Icon = item.icon}
    <Button
      data-active={item.active || page.url.pathname === item.route}
      variant="link"
      href={item.route}
      onclick={() => {
        open = false;
        sidebarStore.navItems = sidebarStore.navItems.map((navItem) => ({
          ...navItem,
          active: navItem.label === item.label,
        }));
        pendingFetches.delete();
      }}
      class="flex items-center gap-4 no-underline! cursor-pointer data-[active=false]:hover:text-foreground data-[active=false]:text-muted-foreground w-full justify-start"
    >
      <Icon class="size-6" />
      <span class="text-sm font-medium tracking-wide">{item.label}</span>
    </Button>
  {/each}
</nav>

<div class="mt-auto px flex flex-col gap-8">
  <Separator class="my-4" orientation="horizontal" />
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
        <form
          {...signout.enhance(({ submit }) => {
            status = "processing";
            submit().finally(() => {
              status = "idle";
            });
          })}
        >
          <AlertDialog.Action type="submit" aria-busy={status === "processing"}>
            {#if status === "processing"}
              <Loader class="h-5 w-5 animate-spin" />
            {:else}
              Logout
            {/if}
          </AlertDialog.Action>
        </form>
      </AlertDialog.Footer>
    </AlertDialog.Content>
  </AlertDialog.Root>
</div>
