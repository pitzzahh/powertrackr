<script lang="ts" module>
  import type { Status } from "$/types/state";

  export type SidebarContentProps = {
    open: boolean;
    user: App.Locals["user"];
  };

  type SidebarContentState = {
    status: Status;
    logoutAttempt: boolean;
  };
</script>

<script lang="ts">
  import { Button } from "$/components/ui/button";
  import { LogOut } from "@lucide/svelte";
  import * as AlertDialog from "$/components/ui/alert-dialog/index.js";
  import SettingsDialog from "./settings-dialog.svelte";
  import { sidebarStore } from "$/stores/sidebar.svelte";
  import { Separator } from "$/components/ui/separator";
  import { pendingFetchContext } from "$/context";
  import { signout } from "$/api/auth.remote";
  import { Loader } from "$/assets/icons";
  import { page } from "$app/state";
  import { onDestroy } from "svelte";
  import * as Avatar from "$/components/ui/avatar/index.js";
  import * as DropdownMenu from "$/components/ui/dropdown-menu/index.js";
  import * as Sidebar from "$/components/ui/sidebar/index.js";
  import BadgeCheckIcon from "@lucide/svelte/icons/badge-check";
  import BellIcon from "@lucide/svelte/icons/bell";
  import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
  import CreditCardIcon from "@lucide/svelte/icons/credit-card";
  import { IsMobile } from "$/hooks/is-mobile.svelte";
  import { toShortName } from "$/utils/text";
  import { toast } from "svelte-sonner";

  let { open = $bindable(false), user }: SidebarContentProps = $props();

  let { status, logoutAttempt }: SidebarContentState = $state({
    status: "idle",
    logoutAttempt: false,
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

<div class="mt-auto px flex flex-col gap-4">
  <Separator class="my-2" orientation="horizontal" />
  <SettingsDialog />
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Sidebar.MenuButton
          size="lg"
          class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          {...props}
        >
          <Avatar.Root class="size-8 rounded-lg">
            <Avatar.Image src={user?.image} alt={user?.name} />
            <Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
          </Avatar.Root>
          <div class="grid flex-1 text-start text-sm leading-tight">
            <span class="truncate font-medium">{user?.name}</span>
            <span class="truncate text-xs">{user?.email}</span>
          </div>
          <ChevronsUpDownIcon class="ms-auto size-4" />
        </Sidebar.MenuButton>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content
      class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
      side={new IsMobile().current ? "bottom" : "right"}
      align="end"
      sideOffset={4}
    >
      <DropdownMenu.Label class="p-0 font-normal">
        <div class="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
          <Avatar.Root class="size-8 rounded-lg">
            <Avatar.Image src={user?.image} alt={user?.name} />
            <Avatar.Fallback class="rounded-lg">PT</Avatar.Fallback>
          </Avatar.Root>
          <div class="grid flex-1 text-start text-sm leading-tight">
            <span class="truncate font-medium"
              >{toShortName(user?.name ?? "PowerTrackr")}</span
            >
            <span class="truncate text-xs">{user?.email}</span>
          </div>
        </div>
      </DropdownMenu.Label>
      <DropdownMenu.Separator />
      <DropdownMenu.Group>
        <DropdownMenu.Item>
          <BadgeCheckIcon />
          Account
        </DropdownMenu.Item>
        <DropdownMenu.Item>
          <CreditCardIcon />
          Billing
        </DropdownMenu.Item>
        <DropdownMenu.Item>
          <BellIcon />
          Notifications
        </DropdownMenu.Item>
      </DropdownMenu.Group>
      <DropdownMenu.Separator />
      <DropdownMenu.Item
        onclick={() => (logoutAttempt = true)}
        variant="destructive"
      >
        <LogOut class="h-6 w-6" />
        <span class="text-sm font-medium tracking-wide">LOGOUT</span>
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>

<AlertDialog.Root bind:open={logoutAttempt}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
      <AlertDialog.Description>
        Any unsaved changes will be lost. You can log back in at any time.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer class="flex flex-row justify-end gap-2">
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <form
        {...signout.enhance(({ submit }) => {
          const toastId = toast.loading("Logging out");
          status = "processing";
          submit().finally(() => {
            status = "idle";
            toast.dismiss(toastId);
            toast.success("Logged out successfully");
          });
        })}
        class="flex"
      >
        <AlertDialog.Action type="submit" aria-busy={status === "processing"}>
          {#if status === "processing"}
            <Loader class="size-5 animate-spin" />
          {:else}
            Logout
          {/if}
        </AlertDialog.Action>
      </form>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
