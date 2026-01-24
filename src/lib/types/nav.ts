import { Icon } from "@lucide/svelte";
export type NavItem = {
  text: string;
  href: string;
  icon: typeof Icon;
  selected: boolean | false;
};
