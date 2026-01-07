<script lang="ts" module>
  import type { Status } from "$/types/state";

  export type SidebarContentProps = {
    open: boolean;
    user: App.Locals["user"];
    /** Whether this is rendered in mobile sheet (no collapse toggle) */
    isMobileSheet?: boolean;
  };

  type SidebarContentState = {
    status: Status;
    logoutAttempt: boolean;
  };
</script>

<script lang="ts">
  import { Button, buttonVariants } from "$/components/ui/button";
  import * as AlertDialog from "$/components/ui/alert-dialog/index.js";
  import SettingsDialog from "./settings-dialog.svelte";
  import { sidebarStore } from "$/stores/sidebar.svelte";
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
  import * as Tooltip from "$/components/ui/tooltip/index.js";
  import { showLoading, showSuccess, toast } from "$/components/toast";

  let { open = $bindable(false), user, isMobileSheet = false }: SidebarContentProps = $props();

  let { status, logoutAttempt }: SidebarContentState = $state({
    status: "idle",
    logoutAttempt: false,
  });

  const pendingFetches = pendingFetchContext.get();

  const collapsed = $derived(sidebarStore.collapsed && !isMobileSheet);

  onDestroy(() => {
    sidebarStore.navItems = sidebarStore.navItems.map((navItem) => ({
      ...navItem,
      active: false,
    }));
  });
</script>

<!-- Collapse toggle button - only show on desktop -->
{#if !isMobileSheet}
  <div
    class={[
      "transition-all duration-300 ease-in-out",
      {
        flex: collapsed,
        "justify-center": collapsed,
        "mb-2": collapsed,
        absolute: !collapsed,
        "-right-4": !collapsed,
        "top-2": !collapsed,
        "z-50": !collapsed,
      },
    ]}
  >
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger
          onclick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            sidebarStore.toggleCollapse();
          }}
          class={buttonVariants({
            variant: "outline",
            size: "icon",
            class: "size-8 bg-card transition-transform duration-300 ease-in-out hover:bg-muted",
          })}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span
            class={[
              "transition-transform duration-300 ease-in-out",
              {
                "rotate-180": collapsed,
                "rotate-0": !collapsed,
              },
            ]}
          >
            <PanelLeftClose class="size-4" />
          </span>
        </Tooltip.Trigger>
        <Tooltip.Content side="right">
          <p>{collapsed ? "Expand sidebar" : "Collapse sidebar"}</p>
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  </div>
{/if}

<nav
  class={[
    "flex flex-col gap-4",
    {
      "justify-center": collapsed,
      "items-center": collapsed,
    },
  ]}
>
  {#each sidebarStore.navItems as item (item.label)}
    {@const Icon = item.icon}
    {@const isActive = item.active || page.url.pathname === item.route}
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <Button
              data-active={isActive}
              variant="link"
              size={collapsed ? "icon" : "default"}
              href={item.route}
              onclick={() => {
                open = false;
                sidebarStore.navItems = sidebarStore.navItems.map((navItem) => ({
                  ...navItem,
                  active: navItem.label === item.label,
                }));
                pendingFetches.delete();
              }}
              class={[
                {
                  "flex w-full cursor-pointer items-center justify-center gap-4 no-underline! data-[active=false]:text-muted-foreground data-[active=false]:hover:text-foreground": true,
                  "justify-start": !collapsed,
                },
              ]}
              {...props}
            >
              <Icon class="size-6" />
              {#if !collapsed}
                <span class="text-sm font-medium tracking-wide">{item.label}</span>
              {/if}
            </Button>
          {/snippet}
        </Tooltip.Trigger>
        {#if collapsed}
          <Tooltip.Content side="right">
            <p>{item.label}</p>
          </Tooltip.Content>
        {/if}
      </Tooltip.Root>
    </Tooltip.Provider>
  {/each}
</nav>

<div class="mt-auto flex flex-col gap-4">
  <Separator class="my-2" orientation="horizontal" />

  <SettingsDialog {collapsed} />

  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      class={[
        buttonVariants({ variant: "secondary" }),
        "flex w-full items-center rounded-lg transition-all duration-300 ease-in-out",
        {
          "justify-center": collapsed,
          "p-1": collapsed,
          "hover:bg-sidebar-accent": true,
          "gap-2": !collapsed,
          "hover:text-sidebar-accent-foreground": !collapsed,
          "data-[state=open]:bg-sidebar-accent": !collapsed,
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
