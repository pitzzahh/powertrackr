<script lang="ts">
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import { cn } from "../utils/cn";
  import { shouldDisableAnimations } from "../utils/reduced-motion";

  interface Props {
    /**
     * Array of text strings to loop through.
     */
    texts: string[];
    /**
     * Interval in milliseconds between text changes.
     * @default 2000
     */
    interval?: number;
    /**
     * Additional CSS classes for the container.
     */
    class?: string;
    currentIndex?: number;
  }

  let { texts, interval = 2000, class: className, currentIndex = $bindable(0) }: Props = $props();
  let isFirst = $state(true);
  let width = $state(0);
  // The widest word reserves the box width so the headline never reflows.
  let widest = $state("");

  function measureWidth(node: HTMLElement) {
    const probe = document.createElement("span");
    probe.style.cssText =
      "position:absolute;visibility:hidden;white-space:nowrap;left:0;top:0;pointer-events:none;";
    probe.style.font = getComputedStyle(node).font;
    document.body.appendChild(probe);

    function measure() {
      let maxWidth = 0;
      let maxText = texts[0] ?? "";
      for (const text of texts) {
        probe.textContent = text;
        if (probe.offsetWidth > maxWidth) {
          maxWidth = probe.offsetWidth;
          maxText = text;
        }
      }
      width = maxWidth;
      widest = maxText;
    }

    measure();
    // Fonts may not be loaded yet — re-measure once they are.
    document.fonts?.ready?.then(measure).catch(() => {});
    return () => {
      document.body.removeChild(probe);
    };
  }

  onMount(() => {
    if (shouldDisableAnimations()) return;
    const loopInterval = setInterval(() => {
      if (document.hidden) return;
      isFirst = false;
      currentIndex = (currentIndex + 1) % texts.length;
    }, interval);
    return () => clearInterval(loopInterval);
  });
</script>

<span
  class={cn("font-inherit relative inline-block text-inherit", className)}
  style="clip-path: inset(-100vh 0 -100vh 0); min-width: auto;"
  {@attach measureWidth}
>
  <!-- Invisible widest word reserves the width and baseline -->
  <span class="font-inherit invisible text-inherit" aria-hidden="true">{widest}</span>
  {#key currentIndex}
    <span
      class={cn(
        "font-inherit absolute inset-0 flex items-center justify-center whitespace-nowrap text-inherit"
      )}
      in:fly={{
        y: isFirst ? 0 : 40,
        opacity: isFirst ? 1 : 0,
        duration: isFirst ? 0 : 300,
        delay: isFirst ? 0 : 150,
      }}
      out:fly={{ y: -40, opacity: 0, duration: 150 }}
    >
      {texts[currentIndex]}
    </span>
  {/key}
</span>
