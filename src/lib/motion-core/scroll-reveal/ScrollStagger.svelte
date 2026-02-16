<script lang="ts">
  import { gsap } from "gsap/dist/gsap";
  import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
  import { CustomEase } from "gsap/dist/CustomEase";
  import type { Snippet } from "svelte";
  import { cn } from "../utils/cn";

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
     * ScrollTrigger start position.
     * @default "top 85%"
     */
    start?: string;
    /**
     * ScrollTrigger end position (for scrub animations).
     */
    end?: string;
    /**
     * Whether to scrub the animation to scroll position.
     * @default false
     */
    scrub?: boolean | number;
    /**
     * Toggle actions for ScrollTrigger.
     * Format: "onEnter onLeave onEnterBack onLeaveBack"
     * @default "play reverse play reverse"
     */
    toggleActions?: string;
    /**
     * Whether the animation should only play once (no reverse on scroll back).
     * @default false
     */
    once?: boolean;
    /**
     * Custom GSAP easing function.
     * @default "motion-core-ease"
     */
    ease?: string;
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
    start = "top 85%",
    end,
    scrub = false,
    toggleActions = "play reverse play reverse",
    once = false,
    ease = "motion-core-ease",
    as = "div" as keyof HTMLElementTagNameMap,
    markers = false,
    from = "start",
    ...restProps
  }: ComponentProps = $props();

  function getInitialState(preset: AnimationPreset): gsap.TweenVars {
    switch (preset) {
      case "fade":
        return { opacity: 0 };
      case "slide-up":
        return { opacity: 0, y: distance };
      case "slide-down":
        return { opacity: 0, y: -distance };
      case "slide-left":
        return { opacity: 0, x: distance };
      case "slide-right":
        return { opacity: 0, x: -distance };
      case "scale":
        return { opacity: 0, scale: scaleValue };
      case "rotate":
        return { opacity: 0, rotation: rotation, transformOrigin: "center center" };
      case "blur":
        return { opacity: 0, filter: `blur(${blurValue}px)` };
      default:
        return { opacity: 0 };
    }
  }

  function getFinalState(preset: AnimationPreset): gsap.TweenVars {
    switch (preset) {
      case "fade":
        return { opacity: 1 };
      case "slide-up":
      case "slide-down":
        return { opacity: 1, y: 0 };
      case "slide-left":
      case "slide-right":
        return { opacity: 1, x: 0 };
      case "scale":
        return { opacity: 1, scale: 1 };
      case "rotate":
        return { opacity: 1, rotation: 0 };
      case "blur":
        return { opacity: 1, filter: "blur(0px)" };
      default:
        return { opacity: 1 };
    }
  }

  function initScrollStagger(node: HTMLElement) {
    gsap.registerPlugin(ScrollTrigger, CustomEase);
    CustomEase.create("motion-core-ease", "0.625, 0.05, 0, 1");

    const childElements = node.querySelectorAll(selector);

    if (!childElements.length) {
      return () => {};
    }

    const initialState = getInitialState(preset);
    const finalState = getFinalState(preset);

    // Create a timeline for proper control
    const tl = gsap.timeline({
      paused: true,
      defaults: {
        ease: ease,
      },
    });

    // Add the staggered animation to timeline
    tl.fromTo(
      childElements,
      { ...initialState, immediateRender: false },
      {
        ...finalState,
        duration: duration,
        delay: delay,
        stagger: {
          each: staggerDelay,
          from: from,
        },
      }
    );

    // Create ScrollTrigger
    const trigger = ScrollTrigger.create({
      trigger: node,
      start: start,
      end: end || (scrub ? "bottom top" : undefined),
      scrub: scrub,
      markers: markers,
      toggleActions: once ? "play none none none" : toggleActions,
      onEnter: () => {
        if (!scrub) tl.play();
      },
      onLeave: () => {
        if (!scrub && !once) tl.reverse();
      },
      onEnterBack: () => {
        if (!scrub && !once) tl.play();
      },
      onLeaveBack: () => {
        if (!scrub && !once) tl.reverse();
      },
      onUpdate: (self) => {
        // For scrub mode, sync timeline progress with scroll
        if (scrub) {
          tl.progress(self.progress);
        }
      },
      onRefresh: (self) => {
        // If element is already past the start point on page load, play immediately
        if (self.progress > 0) {
          tl.progress(scrub ? self.progress : 1);
        }
      },
    });

    // Refresh ScrollTrigger after a short delay to account for layout shifts
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      trigger.kill();
      tl.kill();
    };
  }
</script>

<svelte:element this={as} {...restProps} {@attach initScrollStagger} class={cn(className)}>
  {@render children?.()}
</svelte:element>
