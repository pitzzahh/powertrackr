<script lang="ts">
  import Logo from "$/components/logo.svelte";
  import { Button } from "$/components/ui/button";
  import * as DropdownMenu from "$/components/ui/dropdown-menu";
  import * as ButtonGroup from "$/components/ui/button-group/index.js";
  import * as Sheet from "$lib/components/ui/sheet/index.js";
  import { MoonIcon, SunIcon, User, Menu } from "@lucide/svelte";
  import { toggleMode } from "mode-watcher";
  import SidebarContent from "$routes/(components)/sidebar-content.svelte";

  let { open } = $state({
    open: false,
  });
</script>

<Sheet.Root bind:open>
  <header
    class="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background/10 backdrop-blur-[120px]"
  >
    <div class="flex items-center gap-4">
      <Sheet.Trigger class="md:hidden">
        <Button variant="outline" size="icon">
          <Menu class="h-4 w-4" />
          <span class="sr-only">Open sidebar</span>
        </Button>
      </Sheet.Trigger>
      <Logo variant="ghost" class="px-0" />
    </div>

    <div class="flex items-center justify-center">
      <ButtonGroup.Root>
        <Button onclick={toggleMode} variant="secondary" size="icon">
          <SunIcon
            class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all! dark:scale-0 dark:-rotate-90"
          />
          <MoonIcon
            class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all! dark:scale-100 dark:rotate-0"
          />
          <span class="sr-only">Toggle theme</span>
        </Button>
        <ButtonGroup.Separator />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button {...props} variant="secondary" size="icon">
                <User />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content class="w-56" align="end">
            <DropdownMenu.Label>My Account</DropdownMenu.Label>
            <DropdownMenu.Group>
              <DropdownMenu.Item>
                Profile
                <DropdownMenu.Shortcut>⇧⌘P</DropdownMenu.Shortcut>
              </DropdownMenu.Item>
              <DropdownMenu.Item>
                Billing
                <DropdownMenu.Shortcut>⌘B</DropdownMenu.Shortcut>
              </DropdownMenu.Item>
              <DropdownMenu.Item>
                Settings
                <DropdownMenu.Shortcut>⌘S</DropdownMenu.Shortcut>
              </DropdownMenu.Item>
              <DropdownMenu.Item>
                Keyboard shortcuts
                <DropdownMenu.Shortcut>⌘K</DropdownMenu.Shortcut>
              </DropdownMenu.Item>
            </DropdownMenu.Group>
            <DropdownMenu.Separator />
            <DropdownMenu.Group>
              <DropdownMenu.Item>Team</DropdownMenu.Item>
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger>Invite users</DropdownMenu.SubTrigger>
                <DropdownMenu.SubContent>
                  <DropdownMenu.Item>Email</DropdownMenu.Item>
                  <DropdownMenu.Item>Message</DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item>More...</DropdownMenu.Item>
                </DropdownMenu.SubContent>
              </DropdownMenu.Sub>
              <DropdownMenu.Item>
                New Team
                <DropdownMenu.Shortcut>⌘+T</DropdownMenu.Shortcut>
              </DropdownMenu.Item>
            </DropdownMenu.Group>
            <DropdownMenu.Separator />
            <DropdownMenu.Item>GitHub</DropdownMenu.Item>
            <DropdownMenu.Item>Support</DropdownMenu.Item>
            <DropdownMenu.Item disabled>API</DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item>
              Log out
              <DropdownMenu.Shortcut>⇧⌘Q</DropdownMenu.Shortcut>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </ButtonGroup.Root>
    </div>
  </header>

  <Sheet.Content side="left" class="bg-muted p-4 flex flex-col h-full w-48">
    <SidebarContent />
  </Sheet.Content>
</Sheet.Root>
