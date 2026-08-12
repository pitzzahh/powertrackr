<script lang="ts">
  import { onMount } from "svelte";
  import { fly, fade } from "svelte/transition";
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
  let wordWidths = $state<number[]>([]);
  // Invisible spacer word — reserves width/baseline before measurement.
  let widest = $state("");

  function measureWidth(node: HTMLElement) {
    const probe = document.createElement("span");
    probe.style.cssText =
      "position:absolute;visibility:hidden;white-space:nowrap;left:0;top:0;pointer-events:none;";
    probe.style.font = getComputedStyle(node).font;
    document.body.appendChild(probe);

    function measure() {
      const widths = texts.map((text) => {
        probe.textContent = text;
        return probe.offsetWidth;
      });
      wordWidths = widths;
      const max = Math.max(...widths, 0);
      widest = widths.indexOf(max) >= 0 ? texts[widths.indexOf(max)] : "";
    }

    measure();
    // Fonts may not be loaded yet — re-measure once they are.
    document.fonts?.ready?.then(measure).catch(() => {});
    return () => {
      document.body.removeChild(probe);
    };
  }

  // The box animates between the current word's width and the next, so the
  // headline never jumps and short words don't leave a large gap.
  const boxWidth = $derived(wordWidths[currentIndex] ?? wordWidths[0] ?? 0);

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
  <span
    class="font-inherit invisible inline-block text-inherit"
    style={`${boxWidth ? `width: ${boxWidth}px;` : ""} transition: width 0.3s ease;`}
    aria-hidden="true">{widest || texts[0]}</span
  >
  {#key currentIndex}
    <span
      class={cn(
        "font-inherit absolute inset-0 flex items-center justify-center whitespace-nowrap text-inherit"
      )}
      in:fly={{
        y: isFirst ? 0 : 40,
        opacity: isFirst ? 1 : 0,
        duration: isFirst ? 0 : 280,
        delay: isFirst ? 0 : 100,
      }}
      out:fade={{ duration: 120 }}
    >
      {texts[currentIndex]}
    </span>
  {/key}
</span>
