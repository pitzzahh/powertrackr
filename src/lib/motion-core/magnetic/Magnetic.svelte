<script lang="ts">
  import type { Snippet } from "svelte";
  import { shouldDisableAnimations } from "../utils/reduced-motion";

  interface Props {
    /**
     * Snippet to render content.
     */
    children?: Snippet;
    /**
     * Animation duration in seconds.
     * @default 0.3
     */
    duration?: number;
    /**
     * Additional CSS classes for the container.
     */
    class?: string;
  }

  let { children, duration = 0.3, class: className = "" }: Props = $props();

  let element: HTMLElement = $state(null!);
  let transform = $state("translate(0px, 0px)");

  function handleMouseMove(event: MouseEvent) {
    if (shouldDisableAnimations()) return;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  }

  function handleMouseLeave() {
    transform = "translate(0px, 0px)";
  }
</script>

<div
  bind:this={element}
  onmousemove={handleMouseMove}
  onmouseleave={handleMouseLeave}
  style="transform: {transform}; transition: transform {duration}s ease-out;"
  class={className}
  role="presentation"
>
  {@render children?.()}
</div>
