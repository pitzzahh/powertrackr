<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "../utils/cn";

  interface Props {
    /**
     * Additional CSS classes for the container.
     */
    class?: string;
    /**
     * Gap between marquee items in pixels.
     * @default 32
     */
    gap?: number;
    /**
     * Content to be scrolled in the marquee.
     */
    children?: Snippet;
    /**
     * Number of times to repeat the content to ensure seamless scrolling.
     * @default 3
     */
    repeat?: number;
    /**
     * Duration of one full loop in seconds.
     * @default 5
     */
    duration?: number;
    /**
     * Whether to scroll in the opposite direction.
     * @default false
     */
    reversed?: boolean;
  }

  let {
    class: className = "",
    gap = 32,
    children,
    repeat = 3,
    duration = 5,
    reversed = false,
  }: Props = $props();
</script>

<div class={cn("flex h-full w-full overflow-hidden", className)}>
  <div
    class="marquee-track"
    style="--marquee-repeat: {repeat}; --marquee-duration: {duration}s; animation-direction: {reversed
      ? 'reverse'
      : 'normal'};"
  >
    {#each Array(repeat) as _, i (i)}
      <div
        class="marquee-part flex shrink-0"
        style:gap="{gap}px"
        style:padding-left="{gap / 2}px"
        style:padding-right="{gap / 2}px"
        aria-hidden={i > 0}
      >
        {@render children?.()}
      </div>
    {/each}
  </div>
</div>

<style>
  .marquee-track {
    display: flex;
    width: max-content;
    will-change: transform;
    animation: marquee-scroll linear infinite;
    animation-duration: var(--marquee-duration, 5s);
  }

  @keyframes marquee-scroll {
    to {
      transform: translateX(calc(-100% / var(--marquee-repeat, 3)));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .marquee-track {
      animation: none;
    }
  }
</style>
