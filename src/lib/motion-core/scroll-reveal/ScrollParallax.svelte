<script lang="ts">
  import { gsap } from "gsap/dist/gsap";
  import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
  import type { Snippet } from "svelte";
  import { cn } from "../utils/cn";

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
     * ScrollTrigger start position.
     * @default "top bottom"
     */
    start?: string;
    /**
     * ScrollTrigger end position.
     * @default "bottom top"
     */
    end?: string;
    /**
     * Scrub smoothness (true for instant, or number for smoothing).
     * @default true
     */
    scrub?: boolean | number;
    /**
     * The HTML tag to use for the wrapper.
     * @default "div"
     */
    as?: keyof HTMLElementTagNameMap;
    /**
     * Enable debug markers for ScrollTrigger.
     * @default false
     */
    markers?: boolean;
    /**
     * Custom trigger element selector. Defaults to the element itself.
     */
    trigger?: string | HTMLElement;
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
    [prop: string]: unknown;
  }

  let {
    children,
    class: className = "",
    speed = 0.5,
    direction = "vertical" as ParallaxDirection,
    start = "top bottom",
    end = "bottom top",
    scrub = true,
    as = "div" as keyof HTMLElementTagNameMap,
    markers = false,
    trigger,
    scale: enableScale = false,
    scaleFrom = 1,
    scaleTo = 1.1,
    rotate: enableRotate = false,
    rotateFrom = 0,
    rotateTo = 5,
    fade: enableFade = false,
    opacityFrom = 0,
    opacityTo = 1,
    ...restProps
  }: ComponentProps = $props();

  function initScrollParallax(node: HTMLElement) {
    gsap.registerPlugin(ScrollTrigger);

    // Calculate the parallax distance based on speed
    // speed of 0.5 means element moves at half the scroll speed
    // speed of -0.5 means element moves opposite to scroll
    const distance = speed * 100;

    const fromVars: gsap.TweenVars = {};
    const toVars: gsap.TweenVars = {};

    // Set up directional movement
    if (direction === "vertical") {
      fromVars.yPercent = -distance;
      toVars.yPercent = distance;
    } else {
      fromVars.xPercent = -distance;
      toVars.xPercent = distance;
    }

    // Add scale effect if enabled
    if (enableScale) {
      fromVars.scale = scaleFrom;
      toVars.scale = scaleTo;
    }

    // Add rotation effect if enabled
    if (enableRotate) {
      fromVars.rotation = rotateFrom;
      toVars.rotation = rotateTo;
    }

    // Add opacity fade if enabled
    if (enableFade) {
      fromVars.opacity = opacityFrom;
      toVars.opacity = opacityTo;
    }

    const tween = gsap.fromTo(node, fromVars, {
      ...toVars,
      ease: "none",
      scrollTrigger: {
        trigger: trigger || node,
        start: start,
        end: end,
        scrub: scrub,
        markers: markers,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
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
