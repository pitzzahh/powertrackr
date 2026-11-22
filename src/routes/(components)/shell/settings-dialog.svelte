<script lang="ts" module>
  export type SettingsDialogProps = {
    collapsed?: boolean;
  };
  const NAV = [
    { name: "Import data", icon: Upload },
    { name: "Export data", icon: Download },
  ] as const;
  type NavName = (typeof NAV)[number]["name"];
</script>

<script lang="ts">
  import { Button } from "#lib/components/ui/button/index.js";
  import DynamicModal from "#lib/components/dynamic-modal.svelte";
  import * as Tooltip from "#lib/components/ui/tooltip/index.js";
  import { Settings2, Upload, Download } from "#lib/assets/icons.js";
  import ImportPanel from "./settings/import-panel.svelte";
  import ExportPanel from "./settings/export-panel.svelte";

  let { collapsed = false }: SettingsDialogProps = $props();

  let open = $state(false);
  let active: NavName = $state(NAV[0].name);
</script>

{#if collapsed}
  <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            onclick={() => (open = true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            variant="ghost"
            aria-label="Open settings"
            class="flex w-full items-center justify-center"
          >
            <Settings2 class="size-5 shrink-0" />
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <Tooltip.Content side="right">
        <p>Settings</p>
      </Tooltip.Content>
    </Tooltip.Root>
  </Tooltip.Provider>
{:else}
  <Button
    onclick={() => (open = true)}
    aria-haspopup="dialog"
    aria-expanded={open}
    variant="ghost"
    class="flex w-full cursor-pointer items-center justify-start gap-3 text-muted-foreground hover:text-foreground"
  >
    <Settings2 class="size-5" />
    <span class="text-sm font-medium">Settings</span>
  </Button>
{/if}

<DynamicModal
  bind:open
  title="Settings"
  description="Move your billing data in and out of PowerTrackr."
  size="lg"
  contentClass="flex flex-col overflow-y-auto"
>
  <div class="grid gap-6 sm:grid-cols-[11rem_minmax(0,1fr)]">
    <nav aria-label="Settings sections" class="sm:sticky sm:top-0 sm:self-start">
      <ul class="flex gap-1 sm:flex-col">
        {#each NAV as item (item.name)}
          <li>
            <button
              type="button"
              aria-current={item.name === active ? "page" : undefined}
              onclick={() => (active = item.name)}
              class="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground aria-[current=page]:bg-accent aria-[current=page]:text-foreground"
            >
              <item.icon class="size-4" />
              {item.name}
            </button>
          </li>
        {/each}
      </ul>
    </nav>

    <section class="flex min-w-0 flex-col gap-4">
      {#if active === "Import data"}
        <ImportPanel />
      {:else}
        <ExportPanel />
      {/if}
    </section>
  </div>
</DynamicModal>
