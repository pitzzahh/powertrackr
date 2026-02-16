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
     * Whether to pin the element during animation.
     * @default false
     */
    pin?: boolean;
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
    start = "top 85%",
    end,
    scrub = false,
    pin = false,
    toggleActions = "play reverse play reverse",
    once = false,
    ease = "motion-core-ease",
    as = "div" as keyof HTMLElementTagNameMap,
    markers = false,
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

  function isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    // Check if element is at least partially visible
    return rect.top < windowHeight && rect.bottom > 0;
  }

  function initScrollReveal(node: HTMLElement) {
    gsap.registerPlugin(ScrollTrigger, CustomEase);
    CustomEase.create("motion-core-ease", "0.625, 0.05, 0, 1");

    const initialState = getInitialState(preset);
    const finalState = getFinalState(preset);

    // Check if element is already in viewport on mount
    const alreadyInView = isInViewport(node);

    if (alreadyInView) {
      // Element is already visible - animate immediately with a smooth start
      gsap.fromTo(node, initialState, {
        ...finalState,
        duration: duration,
        delay: delay,
        ease: ease,
      });

      // Still set up ScrollTrigger for reverse animations when scrolling away and back
      if (!once) {
        // Create a timeline for the scroll-triggered reverse behavior
        const tl = gsap.timeline({
          paused: true,
        });

        tl.fromTo(node, initialState, {
          ...finalState,
          duration: duration,
          ease: ease,
        });

        // Seek to end since we already animated in
        tl.progress(1);

        ScrollTrigger.create({
          trigger: node,
          start: start,
          end: end,
          toggleActions: toggleActions,
          markers: markers,
          onLeave: () => tl.reverse(),
          onEnterBack: () => tl.play(),
          onLeaveBack: () => tl.reverse(),
        });

        return () => {
          tl.kill();
          ScrollTrigger.getAll()
            .filter((st) => st.trigger === node)
            .forEach((st) => st.kill());
        };
      }

      return () => {};
    } else {
      // Element not in view - set initial state and wait for scroll
      gsap.set(node, initialState);

      const tween = gsap.to(node, {
        ...finalState,
        duration: scrub ? undefined : duration,
        delay: scrub ? undefined : delay,
        ease: ease,
        scrollTrigger: {
          trigger: node,
          start: start,
          end: end,
          scrub: scrub,
          pin: pin,
          toggleActions: once ? "play none none none" : toggleActions,
          markers: markers,
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    }
  }
</script>

<svelte:element
  this={as}
  {...restProps}
  {@attach initScrollReveal}
  class={cn("will-change-transform", className)}
>
  {@render children?.()}
</svelte:element>
