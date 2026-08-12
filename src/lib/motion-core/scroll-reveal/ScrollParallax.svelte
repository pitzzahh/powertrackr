<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../utils/cn";
  import { shouldDisableAnimations } from "../utils/reduced-motion";

  type ParallaxDirection = "vertical" | "horizontal";

  interface ComponentProps {
    /**
     * The content to apply parallax effect to.
     */
    children?: Snippet;
    /**
     * Additional CSS classes for the container.
     */
    class?: string;
    /**
     * The parallax speed multiplier. Positive values move slower than scroll,
     * negative values move faster/opposite.
     * @default 0.5
     */
    speed?: number;
    /**
     * Direction of the parallax effect.
     * @default "vertical"
     */
    direction?: ParallaxDirection;
    /**
     * Whether to also apply scale effect.
     * @default false
     */
    scale?: boolean;
    /**
     * Starting scale value when scale is enabled.
     * @default 1
     */
    scaleFrom?: number;
    /**
     * Ending scale value when scale is enabled.
     * @default 1.1
     */
    scaleTo?: number;
    /**
     * Whether to also apply rotation effect.
     * @default false
     */
    rotate?: boolean;
    /**
     * Starting rotation in degrees.
     * @default 0
     */
    rotateFrom?: number;
    /**
     * Ending rotation in degrees.
     * @default 5
     */
    rotateTo?: number;
    /**
     * Whether to also apply opacity fade effect.
     * @default false
     */
    fade?: boolean;
    /**
     * Starting opacity value.
     * @default 0
     */
    opacityFrom?: number;
    /**
     * Ending opacity value.
     * @default 1
     */
    opacityTo?: number;
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
    speed = 0.5,
    direction = "vertical" as ParallaxDirection,
    scale: enableScale = false,
    scaleFrom = 1,
    scaleTo = 1.1,
    rotate: enableRotate = false,
    rotateFrom = 0,
    rotateTo = 5,
    fade: enableFade = false,
    opacityFrom = 0,
    opacityTo = 1,
    as = "div" as keyof HTMLElementTagNameMap,
    ...restProps
  }: ComponentProps = $props();

  function initScrollParallax(node: HTMLElement) {
    if (shouldDisableAnimations()) return () => {};

    let raf = 0;

    function update() {
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));

      // speed of 0.5 means the element moves at half the scroll speed
      const distance = speed * 100;
      const offset = (progress - 0.5) * 2 * distance;

      const transforms: string[] = [];
      if (direction === "vertical") transforms.push(`translateY(${offset}%)`);
      else transforms.push(`translateX(${offset}%)`);
      if (enableScale) transforms.push(`scale(${scaleFrom + (scaleTo - scaleFrom) * progress})`);
      if (enableRotate) {
        transforms.push(`rotate(${rotateFrom + (rotateTo - rotateFrom) * progress}deg)`);
      }

      node.style.transform = transforms.join(" ");
      if (enableFade) {
        node.style.opacity = String(opacityFrom + (opacityTo - opacityFrom) * progress);
      }
    }

    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }
</script>

<svelte:element
  this={as}
  {...restProps}
  {@attach initScrollParallax}
  class={cn("will-change-transform", className)}
>
  {@render children?.()}
</svelte:element>
