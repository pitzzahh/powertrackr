<script lang="ts">
  import { Tween } from "svelte/motion";
  import { cubicOut } from "svelte/easing";

  let top = new Tween(0, { duration: 200, easing: cubicOut });
  let left = new Tween(0, { duration: 200, easing: cubicOut });
  let width = new Tween(0, { duration: 200, easing: cubicOut });
  let height = new Tween(0, { duration: 200, easing: cubicOut });
  let opacity = new Tween(0, { duration: 200, easing: cubicOut });

  let mouseDown = $state(false);
</script>

<svelte:document
  onfocusin={(event) => {
    const target = event.target as HTMLElement;
    if (!target || mouseDown) {
      opacity.set(0);
      return;
    }

    const rect = target.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    top.set(rect.top + scrollY - 4);
    left.set(rect.left + scrollX - 4);
    width.set(rect.width + 8);
    height.set(rect.height + 8);
    opacity.set(1);
  }}
  onfocusout={() => opacity.set(0)}
  onmousedown={() => (mouseDown = true)}
  onmouseup={() => (mouseDown = false)}
/>

<span
  class="focus-ring"
  style="top: {top.current}px; left: {left.current}px; width: {width.current}px; height: {height.current}px; opacity: {opacity.current};"
>
  <style>
    .focus-ring {
      position: fixed;
      pointer-events: none;
      z-index: 100;
      border: 2px solid var(--ring);
      border-radius: 4px;
    }
  </style>
</span>
