<script lang="ts">
  import { TriangleAlert, ShieldAlert, CircleAlert, Lock } from "$/assets/icons";
  import type { Component } from "svelte";
</script>

{#snippet satellite(
  Icon: Component,
  positionClass: string,
  duration: string,
  delay: string,
  iconBgClass: string,
  iconTextClass: string,
  bars: string[]
)}
  <div
    class="absolute {positionClass} animate-float"
    style="animation-duration: {duration}; animation-delay: {delay}"
  >
    <div
      class="flex items-center gap-2 rounded-xl border border-white/40 bg-white/60 p-3 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/60"
    >
      <div class="rounded-full p-1.5 {iconBgClass}">
        <Icon class="h-4 w-4 {iconTextClass}" />
      </div>
      <div class="space-y-1">
        {#each bars as width}
          <div class="h-1.5 {width} rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
        {/each}
      </div>
    </div>
  </div>
{/snippet}

<div
  class="relative h-full w-full overflow-hidden border-l border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
>
  <!-- Grid Pattern Background -->
  <div
    class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] bg-size-[24px_24px]"
  ></div>

  <!-- Ambient Glow Effects (Red/Rose for Error Theme) -->
  <div
    class="absolute top-[10%] -left-[20%] h-125 w-125 rounded-full bg-red-500/20 blur-[120px] dark:bg-red-500/10"
  ></div>
  <div
    class="absolute -right-[20%] bottom-[10%] h-125 w-125 rounded-full bg-orange-500/20 blur-[120px] dark:bg-orange-600/10"
  ></div>

  <div class="relative flex h-full flex-col items-center justify-center">
    <!-- Central Element Container -->
    <div class="relative">
      <!-- Pulsing Core Glow (Red) -->
      <div
        class="absolute inset-0 animate-pulse rounded-full bg-linear-to-r from-red-400 to-orange-500 opacity-20 blur-2xl dark:opacity-10"
      ></div>

      <!-- Main Icon (TriangleAlert) -->
      <div
        class="relative flex h-40 w-40 items-center justify-center rounded-3xl border border-white/40 bg-white/10 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/20"
      >
        <TriangleAlert
          class="h-20 w-20 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] dark:text-red-400"
        />
      </div>

      <!-- Floating Satellite 1: Security/Permissions -->
      {@render satellite(
        ShieldAlert,
        "-top-12 -right-16",
        "6s",
        "1s",
        "bg-red-100 dark:bg-red-500/20",
        "text-red-600 dark:text-red-400",
        ["w-12", "w-8"]
      )}

      <!-- Floating Satellite 2: Access/Lock -->
      {@render satellite(
        Lock,
        "-bottom-10 -left-16",
        "7s",
        "0.5s",
        "bg-orange-100 dark:bg-orange-500/20",
        "text-orange-600 dark:text-orange-400",
        ["w-10", "w-14"]
      )}

      <!-- Floating Satellite 3: General Alert -->
      {@render satellite(
        CircleAlert,
        "-right-15 -bottom-10",
        "8s",
        "2s",
        "bg-rose-100 dark:bg-rose-500/20",
        "text-rose-600 dark:text-rose-400",
        ["w-8"]
      )}
    </div>

    <!-- Text Content -->
    <div class="mt-12 text-center">
      <h2 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Something went wrong
      </h2>
      <p class="mt-2 text-zinc-500 dark:text-zinc-400">
        We encountered an unexpected issue. Please try again later or contact support.
      </p>
    </div>
  </div>
</div>

<style>
  /* Define the custom float animation for this component */
  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .animate-float {
    animation-name: float;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    animation-fill-mode: both;
    will-change: transform;
  }
</style>
