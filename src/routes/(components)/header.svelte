<script lang="ts" module>
  import { Icon } from "@lucide/svelte";

  export type HeaderProps = {
    user: App.Locals["user"];
  };

  export type HeaderState = {
    openMenu: boolean;
    quickActions: {
      visible: boolean;
      icon: typeof Icon;
      label: "New Bill" | "Generate Random Bills";
      open: boolean;
      callback: BillingInfoWithSubMetersFormProps["callback"];
    }[];
  };
</script>

<script lang="ts">
  import Logo from "$/components/logo.svelte";
  import { Button, buttonVariants } from "$/components/ui/button";
  import * as Sheet from "$lib/components/ui/sheet/index.js";
  import { Menu, PhilippinePeso, Moon, Sun, Dice6, Loader } from "$/assets/icons";
  import SidebarContent from "$routes/(components)/sidebar-content.svelte";
  import { cn } from "$/utils/style";
  import { toggleMode } from "mode-watcher";
  import { type BillingInfoWithSubMetersFormProps } from "$routes/history/(components)/billing-info-form.svelte";
  import { showSuccess, showWarning } from "$/components/toast";
  import { useBillingStore } from "$lib/stores/billing.svelte.js";
  import { useConsumptionStore } from "$/stores/consumption.svelte";
  import { ScrollArea } from "$/components/ui/scroll-area";
  import { dev } from "$app/environment";
  import type { BillingInfoDTOWithSubMeters } from "$/types/billing-info";
  import { getLatestBillingInfo } from "$/api/billing-info.remote";
  import { Badge } from "$/components/ui/badge";
  import { BillingInfoForm } from "$routes/history/(components)";

  let { user }: HeaderProps = $props();

  const billingStore = useBillingStore();
  const consumptionStore = useConsumptionStore();

  let { openMenu, quickActions }: HeaderState = $state({
    openMenu: false,
    quickActions: [
      {
        visible: true,
        icon: PhilippinePeso,
        label: "New Bill",
        open: false,
        callback: (valid, _action, metaData) => {
          if (valid) {
            billingStore.refresh();
            consumptionStore.refresh();
            showSuccess("Billing info created successfully!");
          } else {
            showWarning("Failed to create billing info", metaData?.error);
          }
        },
      },
    ],
  });
</script>

<Sheet.Root bind:open={openMenu}>
  {@const billingInfo = getLatestBillingInfo({ userId: user?.id || "" })}
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
          {#each quickActions as quickAction (quickAction.label)}
            {#if quickAction.visible}
              {@const Icon = quickAction.icon}
              <Sheet.Root bind:open={quickAction.open}>
                <Sheet.Trigger class={buttonVariants()}>
                  <Icon class="size-4" />
                  <span>{quickAction.label}</span>
                  <span class="sr-only">
                    {quickAction.label}
                  </span>
                </Sheet.Trigger>
                <Sheet.Portal>
                  <Sheet.Content class="w-full gap-1 md:min-w-[60%]" side="left">
                    <Sheet.Header class="flex flex-row items-center justify-between border-b pr-10">
                      <div class="flex flex-col">
                        <Sheet.Title>Add new Bill</Sheet.Title>
                        <Sheet.Description>Enter billing info</Sheet.Description>
                      </div>
                      {#if billingInfo.loading}
                        <Badge
                          variant="secondary"
                          class="flex h-6 animate-pulse items-center text-sm font-medium"
                        >
                          <Loader class="mr-1 h-3.5 w-3.5 animate-spin" />
                          Filling form with previous data...
                        </Badge>
                      {/if}
                    </Sheet.Header>
                    <ScrollArea class="min-h-0 flex-1">
                      {#key billingInfo.current}
                        {@const latestBillingInfo =
                          (billingInfo.current?.value[0] as
                            | BillingInfoDTOWithSubMeters
                            | undefined) ?? undefined}
                        <div class="space-y-4 p-4 pb-8">
                          {#if quickAction.label === "New Bill"}
                            <BillingInfoForm
                              action="add"
                              callback={quickAction.callback}
                              billingInfo={latestBillingInfo}
                              bind:open={quickAction.open}
                            />
                          {/if}
                        </div>
                      {/key}
                    </ScrollArea>
                  </Sheet.Content>
                </Sheet.Portal>
              </Sheet.Root>
            {/if}
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
