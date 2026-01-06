import { Blocks, Zap, History } from "@lucide/svelte";

class SidebarStore {
  navItems = $state([
    { icon: Blocks, label: "DASHBOARD", active: false, route: "/" },
    { icon: Zap, label: "CONSUMPTION", active: false, route: "/consumption" },
    { icon: History, label: "HISTORY", active: false, route: "/history" },
  ]);
  collapsed = $state(false);

  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }
}

export const sidebarStore = new SidebarStore();
