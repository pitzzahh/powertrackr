// Landing page navigation
export const LANDING_NAV_ITEMS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "What's included", href: "/#features" },
  { label: "Who it's for", href: "/#use-cases" },
] as const;

export function handleLandingNavClick(event: MouseEvent, href: string) {
  const hash = href.split("#")[1];
  const targetElement = hash ? document.getElementById(hash) : null;
  if (!targetElement) return;
  event.preventDefault();
  // Offset by the sticky nav height (h-16).
  const top = targetElement.getBoundingClientRect().top + window.scrollY - 64;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
}

export { default as Features } from "./features.svelte";
export { default as Hero } from "./hero.svelte";
export { default as HowItWorks } from "./how-it-works.svelte";
export { default as LandingFooter } from "./landing-footer.svelte";
export { default as LandingNav } from "./landing-nav.svelte";
export { default as Scenarios } from "./scenarios.svelte";
