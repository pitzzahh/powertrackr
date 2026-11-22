<script lang="ts" module>
  export type AccountSettingsProps = {
    user: App.Locals["user"];
    openAccountSettings?: boolean;
  };

  const TABS = [
    { value: "overview", label: "Overview" },
    { value: "change-password", label: "Change Password" },
    { value: "security", label: "Security" },
    { value: "delete-account", label: "Delete Account" },
  ] as const;
</script>

<script lang="ts">
  import DynamicModal from "#lib/components/dynamic-modal.svelte";
  import * as UnderlineTabs from "#lib/components/underline-tabs/index.js";
  import { ScrollArea } from "#lib/components/ui/scroll-area/index.js";
  import { showWarning } from "#lib/components/toast/index.js";
  import OverviewTab from "./account-settings/overview-tab.svelte";
  import PasswordTab from "./account-settings/password-tab.svelte";
  import SecurityTab from "./account-settings/security-tab.svelte";
  import DeleteAccountTab from "./account-settings/delete-account-tab.svelte";

  let { user, openAccountSettings = $bindable(false) }: AccountSettingsProps = $props();

  let activeTab: (typeof TABS)[number]["value"] = $state("overview");
  // One flag per tab, so closing is blocked while any of their requests runs
  let busy = $state({ overview: false, password: false, security: false, delete: false });
</script>

<DynamicModal
  bind:open={openAccountSettings}
  onOpenChange={(open) => {
    if (!open && Object.values(busy).some(Boolean)) {
      showWarning("Process Interrupted", "The operation is still processing. Please wait...");
      openAccountSettings = true;
    }
  }}
  title="Account Settings"
  description="Manage your account settings and preferences."
  size="xl"
>
  <div class="min-h-0 flex-1 overflow-hidden">
    <UnderlineTabs.Root bind:value={activeTab} class="flex h-full flex-col">
      <UnderlineTabs.List class="w-full justify-center md:w-auto md:justify-start">
        {#each TABS as tab (tab.value)}
          <UnderlineTabs.Trigger class="flex-1 md:flex-none" value={tab.value}>
            {tab.label}
          </UnderlineTabs.Trigger>
        {/each}
      </UnderlineTabs.List>

      {#each TABS as tab (tab.value)}
        <UnderlineTabs.Content value={tab.value} class="min-h-0 flex-1">
          <ScrollArea maxHeight="none" class="h-full">
            <div class="p-1 pr-3">
              <!-- Only the active tab mounts, so its actions own the modal footer -->
              {#if activeTab === tab.value}
                {#if tab.value === "overview"}
                  <OverviewTab
                    {user}
                    bind:busy={busy.overview}
                    oncancel={() => (openAccountSettings = false)}
                  />
                {:else if tab.value === "change-password"}
                  <PasswordTab bind:busy={busy.password} />
                {:else if tab.value === "security"}
                  <SecurityTab {user} bind:busy={busy.security} />
                {:else}
                  <DeleteAccountTab
                    {user}
                    bind:busy={busy.delete}
                    ondeleted={() => (openAccountSettings = false)}
                  />
                {/if}
              {/if}
            </div>
          </ScrollArea>
        </UnderlineTabs.Content>
      {/each}
    </UnderlineTabs.Root>
  </div>
</DynamicModal>
