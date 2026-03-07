import { House, Zap, Clock } from "$lib/assets/icons";
import { getContext, setContext } from "svelte";

type NavItem = {
  icon: typeof House;
  label: string;
  active: boolean;
  route: string;
};

type SidebarStore = {
  navItems: NavItem[];
  collapsed: boolean;
  init(collapsed: boolean): void;
  toggleCollapse(): void;
};

function createSidebarStore(): SidebarStore {
  let navItems = $state<NavItem[]>([
    { icon: House, label: "DASHBOARD", active: false, route: "/dashboard" },
    { icon: Zap, label: "CONSUMPTION", active: false, route: "/consumption" },
    { icon: Clock, label: "HISTORY", active: false, route: "/history" },
  ]);

  let collapsed = $state(false);
  let initialized = false;

  return {
    get navItems() {
      return navItems;
    },
    set navItems(value) {
      navItems = value;
    },
    get collapsed() {
      return collapsed;
    },
    set collapsed(value) {
      collapsed = value;
    },
    init(value: boolean) {
      if (!initialized) {
        collapsed = value;
        initialized = true;
      }
    },
    toggleCollapse() {
      collapsed = !collapsed;

      // Save to cookie
      if (typeof document !== "undefined") {
        const maxAge = 365 * 24 * 60 * 60; // 1 year in seconds
        document.cookie = `sidebar-collapsed=${collapsed};max-age=${maxAge};path=/;SameSite=Lax`;
      }
    },
  };
}

const SYMBOL_KEY = "custom-sidebar";

/**
 * Instantiates a new `SidebarStore` instance and sets it in the context.
 *
 * @returns The `SidebarStore` instance.
 */
export function setSidebarStore(): SidebarStore {
  const store = createSidebarStore();
  return setContext(Symbol.for(SYMBOL_KEY), store);
}

/**
 * Retrieves the `SidebarStore` instance from the context.
 * @returns The `SidebarStore` instance.
 */
export function useSidebarStore(): SidebarStore {
  return getContext(Symbol.for(SYMBOL_KEY));
}
