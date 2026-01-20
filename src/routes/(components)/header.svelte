<script lang="ts" module>
  import type { Snippet } from "svelte";
  import { Icon } from "@lucide/svelte";

  export type HeaderProps = {
    user: App.Locals["user"];
  };

  type HeaderState = {
    openMenu: boolean;
    quickActions: {
      icon: typeof Icon;
      label: string;
      content: (callback: BillingInfoWithSubMetersFormProps["callback"]) => ReturnType<Snippet<[]>>;
      callback: BillingInfoWithSubMetersFormProps["callback"];
    }[];
  };
</script>

<script lang="ts">
  import Logo from "$/components/logo.svelte";
  import { Button, buttonVariants } from "$/components/ui/button";
  import * as Sheet from "$lib/components/ui/sheet/index.js";
  import { Menu, PhilippinePeso, Moon, Sun } from "$/assets/icons";
  import SidebarContent from "$routes/(components)/sidebar-content.svelte";
  import { cn } from "$/utils/style";
  import { toggleMode } from "mode-watcher";
  import { scale } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import BillingInfoForm, {
    type BillingInfoWithSubMetersFormProps,
  } from "$routes/history/(components)/billing-info-form.svelte";
  import { ScrollArea } from "$/components/ui/scroll-area";
  import { showSuccess, showError, showWarning } from "$/components/toast";
  import { useBillingStore } from "$lib/stores/billing.svelte.js";
  import { getLatestBillingInfo } from "$/api/billing-info.remote";
  import type { BillingInfoDTOWithSubMeters } from "$/types/billing-info";

  let { user }: HeaderProps = $props();

  const billingStore = useBillingStore();

  let { openMenu, quickActions }: HeaderState = $state({
    openMenu: false,
    quickActions: [
      {
        icon: PhilippinePeso,
        label: "New Bill",
        content: newBill,
        callback: (valid, action, metaData) => {
          openMenu = false;
          if (valid) {
            billingStore.refresh();
            showSuccess(
              action === "add"
                ? "Billing info created successfully!"
                : "Billing info updated successfully!"
            );
          } else {
            showWarning(
              action === "add" ? "Failed to create billing info" : "Failed to update billing info",
              metaData?.error
            );
          }
        },
      },
    ],
  });
</script>

<Sheet.Root bind:open={openMenu}>
  <header
    class="absolute top-0 right-0 left-0 z-5 flex items-center justify-between p-4 backdrop-blur-xs"
  >
    <div class="flex w-full items-center gap-4 md:justify-between">
      <Sheet.Trigger
        class={buttonVariants({
          variant: "outline",
          size: "icon",
          className: "lg:hidden",
        })}
      >
        <Menu class="h-4 w-4" />
        <span class="sr-only">Open sidebar</span>
      </Sheet.Trigger>
      {@render logo({
        className: "mx-auto w-1/2 md:w-fit md:m-0 md:pl-0!",
      })}

      <div class="flex items-center justify-center gap-4">
        <div class="hidden items-center justify-center gap-2 md:flex">
          {#each quickActions as quickAction, index (quickAction.label)}
            {@const Icon = quickAction.icon}
            <span
              in:scale={{
                duration: 250,
                delay: index * 150,
                easing: cubicInOut,
                start: 0.8,
              }}
            >
              <Sheet.Root>
                <Sheet.Trigger class={buttonVariants()}>
                  <Icon class="size-4" />
                  <span>{quickAction.label}</span>
                  <span class="sr-only">
                    {quickAction.label}
                  </span>
                </Sheet.Trigger>
                <Sheet.Portal>
                  <Sheet.Content class="w-full gap-1 md:min-w-[60%]" side="left">
                    <Sheet.Header class="border-b">
                      <Sheet.Title>Add new Bill</Sheet.Title>
                      <Sheet.Description>Enter billing info</Sheet.Description>
                    </Sheet.Header>
                    {@render quickAction.content(quickAction.callback)}
                  </Sheet.Content>
                </Sheet.Portal>
              </Sheet.Root>
            </span>
          {/each}
        </div>

        <Button onclick={toggleMode} variant="secondary" size="icon">
          <Sun
            class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all! dark:scale-0 dark:-rotate-90"
          />
          <Moon
            class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all! dark:scale-100 dark:rotate-0"
          />
          <span class="sr-only">Toggle theme</span>
        </Button>
      </div>
    </div>
  </header>

  <Sheet.Content side="left" class="flex h-full w-full flex-col bg-muted p-4">
    {@render logo({ className: "py-6 w-fit mx-auto", viewTransitionName: "logo-mobile" })}
    <SidebarContent bind:open={openMenu} {user} isMobileSheet={true} />
  </Sheet.Content>
</Sheet.Root>

{#snippet logo({
  className,
  viewTransitionName = "logo",
}: { className?: string; viewTransitionName?: string } = {})}
  <Logo variant="ghost" class={cn("px-0", className)} {viewTransitionName} />
{/snippet}

{#snippet newBill(callback: HeaderState["quickActions"][0]["callback"])}
  <ScrollArea class="h-[calc(100vh-50px)] overflow-y-auto pr-2.5">
    {@const billingInfo = getLatestBillingInfo({ userId: user?.id || "" })}
    <div class="space-y-4 p-4">
      {#key billingInfo.current}
        {@const latestBillingInfo =
          (billingInfo.current?.value[0] as BillingInfoDTOWithSubMeters | undefined) ?? undefined}

        <BillingInfoForm action="add" {callback} billingInfo={latestBillingInfo} />
      {/key}
    </div>
  </ScrollArea>
{/snippet}
