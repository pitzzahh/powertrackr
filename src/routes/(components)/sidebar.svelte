<script lang="ts">
  import { Button } from "$/components/ui/button";
  import {
    SquareArrowOutUpRight,
    Settings2,
    LogOut,
    ChartColumn,
    LayoutDashboard,
    PiggyBank,
    Receipt,
    Zap,
  } from "@lucide/svelte";

  const navItems = $state([
    { icon: LayoutDashboard, label: "DASHBOARD", active: true },
    { icon: ChartColumn, label: "CONSUMPTION", active: false },
    { icon: Zap, label: "SUB METERS", active: false },
    { icon: Receipt, label: "EXPENSES", active: false },
    { icon: PiggyBank, label: "FUNDS", active: false },
  ]);
</script>

<aside
  class="sticky top-24 h-[calc(100vh-8rem)] md:w-48 lg:w-64 bg-muted hidden md:flex flex-col p-8 overflow-y-auto"
>
  <nav class="flex flex-col gap-8">
    {#each navItems as item (item.label)}
      {@const Icon = item.icon}
      <Button
        data-active={item.active}
        variant="link"
        onclick={() => {
          item.active = true;
          navItems.forEach((navItem) => {
            if (navItem.label !== item.label) {
              navItem.active = false;
            }
          });
        }}
        class="flex items-center gap-4 no-underline! cursor-pointer data-[active=false]:hover:text-foreground data-[active=false]:text-muted-foreground w-full justify-start"
      >
        <Icon class="size-6" />
        <span class="text-sm font-medium tracking-wide">{item.label}</span>
      </Button>
    {/each}
  </nav>

  <div class="mt-auto pt-8 border-t border-[#1F1F1F] flex flex-col gap-8">
    <div
      class="flex items-center gap-4 text-[#919191] hover:text-[#E7E7E7] transition-colors cursor-pointer"
    >
      <SquareArrowOutUpRight class="size-6" />
      <span class="text-sm font-medium tracking-wide">FINBRO SUPPORT</span>
    </div>
    <div
      class="flex items-center gap-4 text-[#919191] hover:text-[#E7E7E7] transition-colors cursor-pointer"
    >
      <Settings2 class="h-6 w-6" />
      <span class="text-sm font-medium tracking-wide">SETTINGS</span>
    </div>
    <div
      class="flex items-center gap-4 text-[#919191] hover:text-[#E7E7E7] transition-colors cursor-pointer"
    >
      <LogOut class="h-6 w-6" />
      <span class="text-sm font-medium tracking-wide">LOGOUT</span>
    </div>
  </div>
</aside>
