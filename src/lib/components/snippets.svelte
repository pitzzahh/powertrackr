<script module lang="ts">
  import { TriangleAlert } from "#lib/assets/icons.js";
  import { Skeleton } from "#lib/components/ui/skeleton/index.js";
  import { cn } from "#lib/utils/style.js";

  export type WarningBannerProps = {
    message: string;
  };

  export type ButtonSkeletonProps = {
    /** Mirrors the Button `size` of the controls being replaced. */
    size?: "default" | "lg" | "sm";
    className?: string;
  };

  function buttonSkeletonClass(size: ButtonSkeletonProps["size"], className?: string) {
    return cn(size === "lg" ? "h-10 w-36" : size === "sm" ? "h-4 w-16" : "h-9 w-28", className);
  }

  export { WarningBanner, LoadingDots, ButtonSkeleton };
</script>

{#snippet WarningBanner({ message }: WarningBannerProps)}
  <span class="mt-4 block border-l-4 border-amber-500 bg-amber-500/10 p-3" role="alert">
    <span class="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-500">
      <TriangleAlert class="size-4" />
      Warning
    </span>
    <span class="mt-1 block text-sm text-amber-800 dark:text-amber-400">
      {message}
    </span>
  </span>
{/snippet}

{#snippet LoadingDots()}
  <span>
    <span class="animation-delay-0 animate-pulse">.</span>
    <span class="animation-delay-500 animate-pulse">.</span>
    <span class="animation-delay-1000 animate-pulse">.</span>
  </span>
{/snippet}

{#snippet ButtonSkeleton({ size = "default", className }: ButtonSkeletonProps = {})}
  <span class="flex items-center gap-2" role="status">
    <span class="sr-only">Loading</span>
    <Skeleton aria-hidden="true" class={buttonSkeletonClass(size, className)} />
    <Skeleton aria-hidden="true" class={buttonSkeletonClass(size, className)} />
  </span>
{/snippet}
