<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../utils/cn";
  import { shouldDisableAnimations } from "../utils/reduced-motion";

  type SplitMode = "lines" | "words" | "chars";

  interface ModeSettings {
    duration?: number;
    stagger?: number;
  }

  type SplitRevealConfig = Partial<Record<SplitMode, ModeSettings>>;

  interface ComponentProps {
    /**
     * The content to be split and revealed.
     */
    children?: Snippet;
    /**
     * Additional CSS classes for the container.
     */
    class?: string;
    /**
     * The splitting mode: 'lines', 'words', or 'chars'.
     * @default "lines"
     */
    mode?: SplitMode;
    /**
     * Configuration for animation duration and stagger for each mode.
     */
    config?: SplitRevealConfig;
    /**
     * Delay before the animation starts (in seconds).
     * @default 0
     */
    delay?: number;
    /**
     * Whether to trigger the animation on scroll.
     * @default false
     */
    triggerOnScroll?: boolean;
    /**
     * The HTML tag to use for the wrapper.
     * @default "span"
     */
    as?: keyof HTMLElementTagNameMap;
    [prop: string]: unknown;
  }

  type RequiredConfig = Record<SplitMode, { duration: number; stagger: number }>;

  const DEFAULT_CONFIG: RequiredConfig = {
    lines: { duration: 0.8, stagger: 0.08 },
    words: { duration: 0.6, stagger: 0.06 },
    chars: { duration: 0.4, stagger: 0.008 },
  };

  const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

  let {
    children,
    class: className = "",
    mode = "lines" as SplitMode,
    config,
    as = "span" as keyof HTMLElementTagNameMap,
    delay = 0,
    triggerOnScroll = false,
    ...restProps
  }: ComponentProps = $props();

  // Filter out ARIA and role attributes so ancestor ARIA labels/roles are not forwarded
  // to the internal wrapper element. This prevents duplicate/prohibited ARIA usage
  // when consumers pass `aria-*` or `role` to this component.
  const forwardedProps = $derived(
    Object.fromEntries(
      Object.entries(restProps ?? {}).filter(([k]) => !k.startsWith("aria-") && k !== "role")
    )
  );

  const resolvedConfig = $derived.by(() => {
    const overrides = config?.[mode];
    const defaults = DEFAULT_CONFIG[mode];
    return {
      duration: overrides?.duration ?? defaults.duration,
      stagger: overrides?.stagger ?? defaults.stagger,
    };
  });

  let revealed = $state(false);
  let io: IntersectionObserver | null = null;

  function initSplitReveal(node: HTMLElement) {
    // Split the node's own text, or the text of its single element child
    // (e.g. when wrapping an <h2> or <p>). Mixed content is skipped.
    const elementChildren = [...node.children];
    const target =
      elementChildren.length === 1 ? (elementChildren[0] as HTMLElement) : node;
    if (target !== node && [...target.childNodes].some((n) => n.nodeType === 1)) return () => {};
    const text = target.textContent ?? "";
    if (!text.trim()) return () => {};

    let cancelled = false;

    async function split() {
      try {
        await document.fonts.ready;
      } catch {
        // fonts API unavailable — proceed anyway
      }
      if (cancelled) return;

      target.style.visibility = "hidden";

      const tokens = text.split(/(\s+)/);
      const wordSpans = tokens.map((token) => {
        const span = document.createElement("span");
        span.textContent = token;
        return span;
      });

      // Group tokens into lines by measuring their vertical position.
      let groups: HTMLElement[][] = [];
      if (mode === "lines") {
        target.replaceChildren(...wordSpans);
        void target.offsetWidth; // force reflow for measurement

        let line: HTMLElement[] = [];
        let lastTop: number | null = null;
        for (const word of wordSpans) {
          const top = word.offsetTop;
          if (lastTop !== null && top !== lastTop) {
            groups.push(line);
            line = [];
          }
          line.push(word);
          lastTop = top;
        }
        if (line.length) groups.push(line);
      } else if (mode === "words") {
        groups = wordSpans.map((word) => [word]);
      } else {
        // chars — split each non-whitespace word into characters
        groups = wordSpans.map((word) => {
          if (!word.textContent || !word.textContent.trim()) return [word];
          return [...word.textContent].map((char) => {
            const span = document.createElement("span");
            span.textContent = char;
            return span;
          });
        });
      }

      // Build the revealed DOM.
      const fragment = document.createDocumentFragment();
      let index = 0;
      for (const group of groups) {
        const transitionDelay = `${delay + index * resolvedConfig.stagger}s`;
        const transitionDuration = `${resolvedConfig.duration}s`;

        if (mode === "lines") {
          const mask = document.createElement("span");
          mask.className = "sr-mask";
          const inner = document.createElement("span");
          inner.className = "sr-unit";
          inner.style.transitionDuration = transitionDuration;
          inner.style.transitionDelay = transitionDelay;
          for (const el of group) inner.appendChild(el);
          mask.appendChild(inner);
          fragment.appendChild(mask);
        } else {
          for (const unit of group) {
            unit.className = "sr-unit";
            unit.style.transitionDuration = transitionDuration;
            unit.style.transitionDelay = transitionDelay;
            fragment.appendChild(unit);
          }
        }
        index++;
      }

      target.replaceChildren(fragment);
      target.style.visibility = "visible";

      if (!triggerOnScroll || shouldDisableAnimations()) {
        revealed = true;
        return;
      }

      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              revealed = true;
              io?.disconnect();
            }
          }
        },
        { threshold: 0.2 }
      );
      io.observe(target);
    }

    split();
    return () => {
      cancelled = true;
      io?.disconnect();
    };
  }
</script>

<svelte:element
  this={as}
  {...forwardedProps}
  {@attach initSplitReveal}
  class={cn("font-inherit relative align-baseline text-inherit", className)}
  class:is-revealed={revealed}
>
  {@render children?.()}
</svelte:element>

<style>
  :global(.sr-mask) {
    display: inline-block;
    overflow: hidden;
    vertical-align: top;
  }

  :global(.sr-unit) {
    display: inline-block;
    transform: translateY(110%);
    opacity: 0;
    transition:
      transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: transform;
  }

  .is-revealed :global(.sr-unit) {
    transform: none;
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.sr-unit) {
      transform: none;
      opacity: 1;
      transition: none;
    }
  }
</style>
