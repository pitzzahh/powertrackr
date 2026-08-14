<script lang="ts">
  import { Zap, Banknote, House, ListIcon } from "#lib/assets/icons.js";
  import { Icon as LucideIcon } from "@lucide/svelte";
</script>

{#snippet satellite(
  Icon: typeof LucideIcon,
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
      class="flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 p-3 shadow-lg backdrop-blur-md dark:bg-card/60"
    >
      <div class="rounded-full p-1.5 {iconBgClass}">
        <Icon class="h-4 w-4 {iconTextClass}" />
      </div>
      <div class="space-y-1">
        {#each bars as width}
          <div class="h-1.5 {width} rounded-full bg-border"></div>
        {/each}
      </div>
    </div>
  </div>
{/snippet}

<div class="relative h-full w-full overflow-hidden border-l border-border bg-muted">
  <!-- Grid Pattern Background -->
  <div
    class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] bg-size-[24px_24px]"
  ></div>

  <!-- Ambient Glow Effects -->
  <div
    class="absolute top-[10%] -left-[20%] h-125 w-125 rounded-full bg-primary/15 blur-[120px] dark:bg-primary/10"
  ></div>
  <div
    class="absolute -right-[20%] bottom-[10%] h-125 w-125 rounded-full bg-money/15 blur-[120px] dark:bg-money/10"
  ></div>

  <div class="relative flex h-full flex-col items-center justify-center">
    <!-- Central Element Container -->
    <div class="relative">
      <!-- Pulsing Core Glow -->
      <div
        class="absolute inset-0 animate-pulse rounded-full bg-linear-to-r from-primary to-primary/40 opacity-20 blur-2xl dark:opacity-10"
      ></div>

      <!-- Main Icon (Zap) -->
      <div
        class="relative flex h-40 w-40 items-center justify-center rounded-3xl border border-border/60 bg-card/60 shadow-2xl backdrop-blur-xl"
      >
        <Zap class="h-20 w-20 text-primary drop-shadow-[0_0_15px_var(--color-primary)]" />
      </div>

      <!-- Floating Satellite 1 -->
      {@render satellite(
        House,
        "-top-12 -right-16",
        "6s",
        "1s",
        "bg-primary/15 text-primary",
        "text-primary",
        ["w-12", "w-8"]
      )}

      <!-- Floating Satellite 2 -->
      {@render satellite(
        Banknote,
        "-bottom-10 -left-16",
        "7s",
        "0.5s",
        "bg-money/15",
        "text-money",
        ["w-10", "w-14"]
      )}

      <!-- Floating Satellite 3 -->
      {@render satellite(
        ListIcon,
        "-right-15 -bottom-10",
        "8s",
        "2s",
        "bg-chart-11/15",
        "text-chart-11",
        ["w-8"]
      )}
    </div>

    <!-- Text Content -->
    <div class="mt-12 text-center">
      <h2 class="text-2xl font-bold tracking-tight text-foreground">Simplify utility tracking</h2>
      <p class="mt-2 text-muted-foreground">
        Manage sub-meters, allocate payments, and reconcile electricity usage with ease.
      </p>
    </div>
  </div>
</div>

<style>
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
