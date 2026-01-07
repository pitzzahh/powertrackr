<script lang="ts" module>
  export type SettingsDialogProps = {
    collapsed?: boolean;
  };
</script>

<script lang="ts">
  import * as Breadcrumb from "$/components/ui/breadcrumb/index.js";
  import { Button } from "$/components/ui/button/index.js";
  import * as Dialog from "$/components/ui/dialog/index.js";
  import * as Sidebar from "$/components/ui/sidebar/index.js";
  import * as Tooltip from "$/components/ui/tooltip/index.js";
  import {
    Settings2,
    Bell,
    Check,
    Globe,
    House,
    Keyboard,
    Link,
    Lock,
    Menu,
    MessageCircle,
    Paintbrush,
    Settings,
    Video,
  } from "$/assets/icons";
  const data = {
    nav: [
      { name: "Notifications", icon: Bell },
      { name: "Navigation", icon: Menu },
      { name: "Home", icon: House },
      { name: "Appearance", icon: Paintbrush },
      { name: "Messages & media", icon: MessageCircle },
      { name: "Language & region", icon: Globe },
      { name: "Accessibility", icon: Keyboard },
      { name: "Mark as read", icon: Check },
      { name: "Audio & video", icon: Video },
      { name: "Connected accounts", icon: Link },
      { name: "Privacy & visibility", icon: Lock },
      { name: "Advanced", icon: Settings },
    ],
  };
  let { collapsed = false }: SettingsDialogProps = $props();

  let open = $state(false);
</script>

<Dialog.Root bind:open>
  {#if collapsed}
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <Dialog.Trigger {...props}>
              {#snippet child({ props: triggerProps })}
                <Button
                  {...triggerProps}
                  variant="ghost"
                  class="flex items-center justify-center w-full transition-all duration-300 ease-in-out"
                >
                  <Settings2 class="size-6 shrink-0" />
                </Button>
              {/snippet}
            </Dialog.Trigger>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content side="right">
          <p>SETTINGS</p>
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  {:else}
    <Dialog.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          class="flex items-center gap-4 no-underline! cursor-pointer w-full justify-start"
        >
          <Settings2 class="size-6" />
          <span class="text-sm font-medium tracking-wide">SETTINGS</span>
        </Button>
      {/snippet}
    </Dialog.Trigger>
  {/if}
  <Dialog.Content
    class="overflow-hidden p-0 md:max-h-125 md:max-w-175 lg:max-w-200"
    trapFocus={false}
  >
    <Dialog.Title class="sr-only">Settings</Dialog.Title>
    <Dialog.Description class="sr-only"
      >Customize your settings here.</Dialog.Description
    >
    <Sidebar.Provider class="items-start">
      <Sidebar.Root collapsible="none" class="hidden md:flex">
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupContent>
              <Sidebar.Menu>
                {#each data.nav as item (item.name)}
                  <Sidebar.MenuItem>
                    <Sidebar.MenuButton
                      isActive={item.name === "Messages & media"}
                    >
                      {#snippet child({ props })}
                        <a href="##" {...props}>
                          <item.icon />
                          <span>{item.name}</span>
                        </a>
                      {/snippet}
                    </Sidebar.MenuButton>
                  </Sidebar.MenuItem>
                {/each}
              </Sidebar.Menu>
            </Sidebar.GroupContent>
          </Sidebar.Group>
        </Sidebar.Content>
      </Sidebar.Root>
      <main class="flex h-120 flex-1 flex-col overflow-hidden">
        <header
          class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
        >
          <div class="flex items-center gap-2 px-4">
            <Breadcrumb.Root>
              <Breadcrumb.List>
                <Breadcrumb.Item class="hidden md:block">
                  <Breadcrumb.Link href="##">Settings</Breadcrumb.Link>
                </Breadcrumb.Item>
                <Breadcrumb.Separator class="hidden md:block" />
                <Breadcrumb.Item>
                  <Breadcrumb.Page>Messages & media</Breadcrumb.Page>
                </Breadcrumb.Item>
              </Breadcrumb.List>
            </Breadcrumb.Root>
          </div>
        </header>
        <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
          {#each { length: 10 }, i (i)}
            <div class="bg-muted/50 aspect-video max-w-3xl rounded-xl"></div>
          {/each}
        </div>
      </main>
    </Sidebar.Provider>
  </Dialog.Content>
</Dialog.Root>
