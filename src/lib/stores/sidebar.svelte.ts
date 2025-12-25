import { Blocks, Zap, History } from "@lucide/svelte";

class SidebarStore {
  navItems = $state([
    { icon: Blocks, label: "DASHBOARD", active: true, route: "/" },
    { icon: Zap, label: "CONSUMPTION", active: false, route: "/consumption" },
    { icon: History, label: "HISTORY", active: false, route: "/history" },
  ]);
}

export const sidebarStore = new SidebarStore();
