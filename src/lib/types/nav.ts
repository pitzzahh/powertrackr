import type { PhosphorIcon } from "#lib/assets/icons.js";
export type NavItem = {
  text: string;
  href: string;
  icon: PhosphorIcon;
  selected: boolean | false;
};
