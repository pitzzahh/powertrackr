<script lang="ts" module>
  import type { AsyncState } from "$/types/state";

  export type SidebarContentProps = {
    open: boolean;
    user: App.Locals["user"];
    /** Whether this is rendered in mobile sheet (no collapse toggle) */
    isMobileSheet?: boolean;
  };

  type SidebarContentState = {
    status: AsyncState;
    logoutAttempt: boolean;
  };
</script>

<script lang="ts">
  import { Button, buttonVariants } from "$/components/ui/button";
  import * as AlertDialog from "$/components/ui/alert-dialog/index.js";
  import SettingsDialog from "./settings-dialog.svelte";
  import { useSidebarStore } from "$/stores/sidebar.svelte";
  import { Separator } from "$/components/ui/separator";
  import { pendingFetchContext } from "$/context";
  import { signout } from "$/api/auth.remote";
  import {
    Loader,
    PanelLeftClose,
    LogOut,
    BadgeCheck,
    Bell,
    ChevronsUpDown,
    CreditCard,
  } from "$/assets/icons";
  import { page } from "$app/state";
  import { onDestroy } from "svelte";
  import * as Avatar from "$/components/ui/avatar/index.js";
  import * as DropdownMenu from "$/components/ui/dropdown-menu/index.js";
  import { IsMobile } from "$/hooks/is-mobile.svelte";
  import { toShortName } from "$/utils/text";
  import { showLoading, showSuccess, toast } from "$/components/toast";
  import { goto } from "$app/navigation";

  let { open = $bindable(false), user, isMobileSheet = false }: SidebarContentProps = $props();

  const sidebar = useSidebarStore();

  let { status, logoutAttempt }: SidebarContentState = $state({
    status: "idle",
    logoutAttempt: false,
  });

  const pendingFetches = pendingFetchContext.get();

  const collapsed = $derived(sidebar.collapsed && !isMobileSheet);

  onDestroy(() => {
    sidebar.navItems = sidebar.navItems.map((navItem) => ({
      ...navItem,
      active: false,
    }));
  });
</script>

<nav
  class={[
    "flex flex-col gap-4",
    {
      "justify-center": collapsed,
      "items-center": collapsed,
    },
  ]}
>
  {#each sidebar.navItems as item (item.label)}
    {@const Icon = item.icon}
    {@const isActive = item.active || page.url.pathname === item.route}
    <Button
      onclick={() => {
        open = false;
        pendingFetches.delete();
        sidebar.navItems = sidebar.navItems.map((navItem) => ({
          ...navItem,
          active: navItem.label === item.label,
        }));
        goto(item.route);
      }}
      data-active={isActive}
      variant="link"
      size={collapsed ? "icon" : "default"}
      class={[
        {
          "flex w-full cursor-pointer items-center justify-center gap-4 no-underline! data-[active=false]:text-muted-foreground data-[active=false]:hover:text-foreground data-[active=true]:text-primary": true,
          "justify-start": !collapsed,
        },
      ]}
      title={collapsed && !isMobileSheet ? item.label : undefined}
    >
      <Icon class="size-6" />
      {#if !collapsed}
        <span class="text-sm font-medium tracking-wide">{item.label}</span>
      {/if}
    </Button>
  {/each}
</nav>

<div class="mt-auto flex flex-col gap-4">
  <Separator class="my-2" orientation="horizontal" />

  <SettingsDialog {collapsed} />

  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      class={[
        buttonVariants({ variant: "ghost" }),
        "flex w-full items-center rounded-lg p-0 transition-all duration-150 ease-in-out",
        {
          "justify-center": collapsed,
          "p-1": collapsed,
          "gap-2 px-2!": !collapsed,
          "hover:text-sidebar-accent-foreground": !collapsed,
          "data-[state=open]:text-sidebar-accent-foreground": !collapsed,
        },
      ]}
      aria-label="User menu"
    >
      <Avatar.Root class="size-8 shrink-0 rounded-lg">
        <Avatar.Image src={user?.image} alt={user?.name} />
        <Avatar.Fallback class="rounded-lg"
          >{toShortName(user?.name || "Power Trackr")}</Avatar.Fallback
        >
      </Avatar.Root>
      {#if !collapsed}
        <div class="grid flex-1 text-start text-sm leading-tight">
          <span class="truncate font-medium">{user?.name}</span>
          <span class="truncate text-xs">{user?.email}</span>
        </div>
        <ChevronsUpDown class="ms-auto size-4 shrink-0" />
      {/if}
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
            <Avatar.Fallback class="rounded-lg"
              >{toShortName(user?.name || "Power Trackr")}</Avatar.Fallback
            >
          </Avatar.Root>
          <div class="grid flex-1 text-start text-sm leading-tight">
            <span class="truncate font-medium">{user?.name ?? "PowerTrackr"}</span>
            <span class="truncate text-xs">{user?.email}</span>
          </div>
        </div>
      </DropdownMenu.Label>
      <DropdownMenu.Separator />
      <DropdownMenu.Group>
        <DropdownMenu.Item>
          <BadgeCheck />
          Account
        </DropdownMenu.Item>
        <DropdownMenu.Item>
          <CreditCard />
          Billing
        </DropdownMenu.Item>
        <DropdownMenu.Item>
          <Bell />
          Notifications
        </DropdownMenu.Item>
      </DropdownMenu.Group>
      <DropdownMenu.Separator />
      <DropdownMenu.Item onclick={() => (logoutAttempt = true)} variant="destructive">
        <LogOut class="h-6 w-6" />
        <span class="text-sm font-medium tracking-wide">LOGOUT</span>
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>

<div class="flex justify-center">
  <Button
    variant="outline"
    onclick={() => sidebar.toggleCollapse()}
    size={collapsed ? "icon" : "default"}
    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    class={[
      "mt-4",
      {
        "w-full": !collapsed,
      },
    ]}
  >
    <PanelLeftClose
      class={[
        "size-4 transition-transform duration-150 ease-in-out",
        {
          "rotate-180": collapsed,
          "rotate-0": !collapsed,
        },
      ]}
    />
    {#if !collapsed}
      Collapse
    {/if}
  </Button>
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
          const toastId = showLoading("Logging out");
          status = "processing";
          submit().finally(() => {
            status = "idle";
            toast.dismiss(toastId);
            showSuccess("Logged out successfully");
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
