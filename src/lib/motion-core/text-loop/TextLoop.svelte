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
>
  <span class="font-inherit invisible inline-block w-0 text-inherit" aria-hidden="true">&nbsp;</span
  >{#key currentIndex}
    <span
      class={cn("font-inherit inline-block whitespace-nowrap text-inherit")}
      in:fly={{ y: isFirst ? 0 : 40, opacity: isFirst ? 1 : 0, duration: isFirst ? 0 : 300, delay: isFirst ? 0 : 150 }}
      out:fly={{ y: -40, opacity: 0, duration: 150 }}
    >
      {texts[currentIndex]}
    </span>
  {/key}
</span>
