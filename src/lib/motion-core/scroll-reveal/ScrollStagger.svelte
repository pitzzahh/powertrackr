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
     * The children elements to be stagger-animated on scroll.
     */
    children?: Snippet;
    /**
     * Additional CSS classes for the container.
     */
    class?: string;
    /**
     * CSS selector for child elements to animate.
     * @default ":scope > *"
     */
    selector?: string;
    /**
     * Animation preset to use.
     * @default "slide-up"
     */
    preset?: AnimationPreset;
    /**
     * Animation duration for each element in seconds.
     * @default 0.6
     */
    duration?: number;
    /**
     * Stagger delay between each element in seconds.
     * @default 0.1
     */
    stagger?: number;
    /**
     * Initial delay before the first animation starts (in seconds).
     * @default 0
     */
    delay?: number;
    /**
     * Distance for slide animations (in pixels).
     * @default 40
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
     * @default 8
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
    /**
     * Stagger from position: start, center, end, edges, or random.
     * @default "start"
     */
    from?: "start" | "center" | "end" | "edges" | "random";
    [prop: string]: unknown;
  }

  let {
    children,
    class: className = "",
    selector = ":scope > *",
    preset = "slide-up" as AnimationPreset,
    duration = 0.6,
    stagger: staggerDelay = 0.1,
    delay = 0,
    distance = 40,
    scale: scaleValue = 0.9,
    rotation = 10,
    blur: blurValue = 8,
    once = false,
    as = "div" as keyof HTMLElementTagNameMap,
    from = "start",
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

  function staggerOrder(index: number, count: number, from: string): number {
    switch (from) {
      case "end":
        return count - 1 - index;
      case "center":
        return Math.abs(index - (count - 1) / 2);
      case "edges":
        return Math.min(index, count - 1 - index);
      case "random":
        return Math.random();
      default:
        return index;
    }
  }

  let revealed = $state(false);

  function initScrollStagger(node: HTMLElement) {
    if (shouldDisableAnimations()) {
      revealed = true;
      return () => {};
    }

    const childElements = [...node.querySelectorAll(selector)] as HTMLElement[];
    const hiddenStyles = childElements.map((el, i) => {
      const order = staggerOrder(i, childElements.length, from);
      const delayS = delay + order * staggerDelay;
      return [
        getInitialStyle(preset),
        `transition: opacity ${duration}s ${EASE} ${delayS}s, transform ${duration}s ${EASE} ${delayS}s, filter ${duration}s ${EASE} ${delayS}s;`,
      ].join(" ");
    });

    childElements.forEach((el, i) => {
      el.style.cssText = hiddenStyles[i];
    });

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            revealed = true;
            for (const el of childElements) {
              el.style.opacity = "1";
              el.style.transform = "none";
              el.style.filter = "none";
            }
            if (once) io.disconnect();
          } else if (!once) {
            revealed = false;
            childElements.forEach((el, i) => {
              el.style.cssText = hiddenStyles[i];
            });
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    io.observe(node);
    return () => io.disconnect();
  }
</script>

<svelte:element this={as} {...restProps} {@attach initScrollStagger} class={cn(className)}>
  {@render children?.()}
</svelte:element>
