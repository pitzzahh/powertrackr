export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  // Simple heuristic: check for hardwareConcurrency < 4 or memory < 4GB
  const cores = navigator.hardwareConcurrency || 2;
  const memory = (navigator as any).deviceMemory || 4;
  return cores < 4 || memory < 4;
}

export function shouldDisableAnimations(): boolean {
  return prefersReducedMotion() || isLowEndDevice();
}
