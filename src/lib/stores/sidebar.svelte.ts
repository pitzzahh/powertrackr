import { House, Zap, Clock } from "$lib/assets/icons";

class SidebarStore {
  navItems = $state([
    { icon: House, label: "DASHBOARD", active: false, route: "/" },
    { icon: Zap, label: "CONSUMPTION", active: false, route: "/consumption" },
    { icon: Clock, label: "HISTORY", active: false, route: "/history" },
  ]);

  collapsed = $state(false);
  #initialized = false;

  init(collapsed: boolean) {
    if (!this.#initialized) {
      this.collapsed = collapsed;
      this.#initialized = true;
    }
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;

    // Save to cookie
    if (typeof document !== "undefined") {
      const maxAge = 365 * 24 * 60 * 60; // 1 year in seconds
      document.cookie = `sidebar-collapsed=${this.collapsed};max-age=${maxAge};path=/;SameSite=Lax`;
    }
  }
}

export const sidebarStore = new SidebarStore();
