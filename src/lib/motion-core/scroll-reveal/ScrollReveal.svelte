<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../utils/cn";
  import { shouldDisableAnimations } from "../utils/reduced-motion";

  type AnimationPreset =
    | "fade"
    | "slide-up"
    | "slide-down"
    | "slide-left"
    | "slide-right"
    | "scale"
    | "rotate"
    | "blur";

  interface ComponentProps {
    /**
     * The content to be revealed on scroll.
     */
    children?: Snippet;
    /**
     * Additional CSS classes for the container.
     */
    class?: string;
    /**
     * Animation preset to use.
     * @default "fade"
     */
    preset?: AnimationPreset;
    /**
     * Animation duration in seconds.
     * @default 0.8
     */
    duration?: number;
    /**
     * Delay before the animation starts (in seconds).
     * @default 0
     */
    delay?: number;
    /**
     * Distance for slide animations (in pixels).
     * @default 60
     */
    distance?: number;
    /**
     * Scale factor for scale animation (0-1).
     * @default 0.9
     */
    scale?: number;
    /**
     * Rotation degrees for rotate animation.
     * @default 10
     */
    rotation?: number;
    /**
     * Blur amount for blur animation (in pixels).
     * @default 10
     */
    blur?: number;
    /**
     * Whether the animation should only play once (no reverse on scroll back).
     * @default false
     */
    once?: boolean;
    /**
     * The HTML tag to use for the wrapper.
     * @default "div"
     */
    as?: keyof HTMLElementTagNameMap;
    [prop: string]: unknown;
  }

  let {
    children,
    class: className = "",
    preset = "fade" as AnimationPreset,
    duration = 0.8,
    delay = 0,
    distance = 60,
    scale: scaleValue = 0.9,
    rotation = 10,
    blur: blurValue = 10,
    once = false,
    as = "div" as keyof HTMLElementTagNameMap,
    ...restProps
  }: ComponentProps = $props();

  const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

  function getInitialStyle(preset: AnimationPreset): string {
    switch (preset) {
      case "slide-up":
        return `opacity: 0; transform: translateY(${distance}px);`;
      case "slide-down":
        return `opacity: 0; transform: translateY(${-distance}px);`;
      case "slide-left":
        return `opacity: 0; transform: translateX(${distance}px);`;
      case "slide-right":
        return `opacity: 0; transform: translateX(${-distance}px);`;
      case "scale":
        return `opacity: 0; transform: scale(${scaleValue});`;
      case "rotate":
        return `opacity: 0; transform: rotate(${rotation}deg); transform-origin: center;`;
      case "blur":
        return `opacity: 0; filter: blur(${blurValue}px);`;
      default:
        return "opacity: 0;";
    }
  }

  let revealed = $state(false);

  function initScrollReveal(node: HTMLElement) {
    if (shouldDisableAnimations()) {
      revealed = true;
      return () => {};
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            revealed = true;
            if (once) io.disconnect();
          } else if (!once) {
            revealed = false;
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    io.observe(node);
    return () => io.disconnect();
  }
</script>

<svelte:element
  this={as}
  {...restProps}
  {@attach initScrollReveal}
  class={cn("will-change-transform", className)}
  style={[
    revealed ? "opacity: 1; transform: none; filter: none;" : getInitialStyle(preset),
    `transition: opacity ${duration}s ${EASE} ${delay}s, transform ${duration}s ${EASE} ${delay}s, filter ${duration}s ${EASE} ${delay}s;`,
  ].join(" ")}
>
  {@render children?.()}
</svelte:element>
