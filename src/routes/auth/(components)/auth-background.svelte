<script lang="ts">
  import { Zap, Banknote, House, ListIcon } from "$/assets/icons";
</script>

<div
  class="relative h-full w-full overflow-hidden border-l border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
>
  <div
    class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] bg-size-[24px_24px]"
  ></div>

  <div
    class="absolute top-[10%] -left-[20%] h-125 w-125 rounded-full bg-yellow-500/20 blur-[120px] dark:bg-yellow-500/10"
  ></div>
  <div
    class="absolute -right-[20%] bottom-[10%] h-125 w-125 rounded-full bg-orange-500/20 blur-[120px] dark:bg-orange-600/10"
  ></div>

  <div class="relative flex h-full flex-col items-center justify-center">
    <!-- Central Element -->
    <div class="relative">
      <div
        class="absolute inset-0 animate-pulse rounded-full bg-linear-to-r from-yellow-400 to-orange-500 opacity-20 blur-2xl dark:opacity-10"
      ></div>

      <div
        class="relative flex h-40 w-40 items-center justify-center rounded-3xl border border-white/40 bg-white/10 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/20"
      >
        <Zap
          class="h-20 w-20 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] dark:text-yellow-400"
        />
      </div>

      <!-- Floating Satellite 1 -->
      <div
        class="absolute -top-12 -right-16 animate-bounce animation-duration-[3s] [animation-delay:1s]"
      >
        <div
          class="flex items-center gap-2 rounded-xl border border-white/40 bg-white/60 p-3 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/60"
        >
          <div class="rounded-full bg-blue-100 p-1.5 dark:bg-blue-500/20">
            <House class="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="space-y-1">
            <div class="h-1.5 w-12 rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
            <div class="h-1.5 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
          </div>
        </div>
      </div>

      <!-- Floating Satellite 2 -->
      <div
        class="absolute -bottom-10 -left-16 animate-bounce animation-duration-[4s] [animation-delay:0.5s]"
      >
        <div
          class="flex items-center gap-2 rounded-xl border border-white/40 bg-white/60 p-3 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/60"
        >
          <div class="rounded-full bg-green-100 p-1.5 dark:bg-green-500/20">
            <Banknote class="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div class="space-y-1">
            <div class="h-1.5 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
            <div class="h-1.5 w-14 rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
          </div>
        </div>
      </div>

      <!-- Floating Satellite 3 -->
      <div
        class="absolute -right-15 -bottom-10 animate-bounce animation-duration-[5s] [animation-delay:2s]"
      >
        <div
          class="flex items-center gap-2 rounded-xl border border-white/40 bg-white/60 p-3 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/60"
        >
          <div class="rounded-full bg-purple-100 p-1.5 dark:bg-purple-500/20">
            <ListIcon class="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div class="space-y-1">
            <div class="h-1.5 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-12 text-center">
      <h2 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Simplify utility tracking
      </h2>
      <p class="mt-2 text-zinc-500 dark:text-zinc-400">
        Manage sub-meters, allocate payments, and reconcile electricity usage with ease.
      </p>
    </div>
  </div>
</div>

<style>
</style>
