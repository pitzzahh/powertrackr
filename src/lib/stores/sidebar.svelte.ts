import { Blocks, Zap, History } from "@lucide/svelte";

class SidebarStore {
  navItems = $state([
    { icon: Blocks, label: "DASHBOARD", active: true },
    { icon: Zap, label: "CONSUMPTION", active: false },
    { icon: History, label: "HISTORY", active: false },
  ]);
}

export const sidebarStore = new SidebarStore();
