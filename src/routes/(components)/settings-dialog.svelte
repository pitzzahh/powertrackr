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
  import { Settings2, Upload, Download } from "$/assets/icons";
  let { collapsed = false }: SettingsDialogProps = $props();

  const NAV_DATA = {
    nav: [
      { name: "Import Data", icon: Upload },
      { name: "Export Data", icon: Download },
    ],
  } as const;

  type NavName = (typeof NAV_DATA.nav)[number]["name"];

  // dialog open state
  let open = $state(false);

  // currently selected nav item (defaults to the first nav entry)
  let active_setting = $state<NavName>(NAV_DATA.nav?.[0]?.name ?? "Import Data");
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
                  class="flex w-full items-center justify-center transition-all duration-300 ease-in-out"
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
          class="flex w-full cursor-pointer items-center justify-start gap-4 no-underline!"
        >
          <Settings2 class="size-6" />
          <span class="text-sm font-medium tracking-wide">SETTINGS</span>
        </Button>
      {/snippet}
    </Dialog.Trigger>
  {/if}
  <Dialog.Content
    class="h-[90vh] overflow-hidden p-0 md:h-[85vh] md:max-w-175 lg:max-w-250"
    trapFocus={false}
  >
    <Dialog.Title class="sr-only">Settings</Dialog.Title>
    <Dialog.Description class="sr-only">Customize your settings here.</Dialog.Description>
    <Sidebar.Provider class="h-full min-h-0 items-start">
      <Sidebar.Root collapsible="none" class="hidden md:flex">
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupContent>
              <Sidebar.Menu>
                {#each NAV_DATA.nav as item (item.name)}
                  <Sidebar.MenuItem>
                    <Sidebar.MenuButton
                      onclick={() => (active_setting = item.name)}
                      isActive={item.name === active_setting}
                    >
                      {#snippet child({ props })}
                        <a
                          href="##"
                          {...props}
                          onclick={(e) => {
                            e.preventDefault();
                            active_setting = item.name;
                          }}
                        >
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
      <main class="flex h-full min-h-0 flex-1 flex-col overflow-y-auto">
        <header
          class="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
        >
          <div class="flex items-center gap-2 px-4">
            <Breadcrumb.Root>
              <Breadcrumb.List>
                <Breadcrumb.Item class="hidden md:block">
                  <Breadcrumb.Link href="##">Settings</Breadcrumb.Link>
                </Breadcrumb.Item>
                <Breadcrumb.Separator class="hidden md:block" />
                <Breadcrumb.Item>
                  <Breadcrumb.Page>{active_setting}</Breadcrumb.Page>
                </Breadcrumb.Item>
              </Breadcrumb.List>
            </Breadcrumb.Root>
          </div>
        </header>
        <div class="flex min-h-0 flex-1 flex-col gap-4 p-4 pt-0">
          <div class="flex min-h-0 flex-1 flex-col gap-4">
            {#if active_setting === "Import Data"}
              {@render Import()}
            {:else if active_setting === "Export Data"}
              {@render Export()}
            {/if}
          </div>
        </div>
      </main>
    </Sidebar.Provider>
  </Dialog.Content>
</Dialog.Root>

{#snippet Import()}
  <div>
    <h2 class="text-lg font-medium">Import Data</h2>
    <p class="text-sm text-muted-foreground">
      Upload your data file to import records into the system.
    </p>
  </div>
  <div class="min-h-[320px] w-full max-w-3xl rounded-xl bg-muted/50"></div>
{/snippet}

{#snippet Export()}
  <div>
    <h2 class="text-lg font-medium">Export Data</h2>
    <p class="text-sm text-muted-foreground">Export data from the system to a downloadable file.</p>
  </div>
  <div class="min-h-[320px] w-full max-w-3xl rounded-xl bg-muted/50"></div>
{/snippet}
