<script lang="ts" module>
  import type { Snippet } from "svelte";

  export type ToastVariant = "info" | "success" | "warning" | "error";
  export type ToastPosition =
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "bottom-center";

  export interface ToastProps {
    title: string;
    description?: string | Snippet;
    variant?: ToastVariant;
    dismissible?: boolean;
    onDismiss?: () => void;
    position?: ToastPosition;
    action?: {
      label: string;
      onClick: () => void;
    };
    class?: string;
    isLoading?: boolean;
  }
</script>

<script lang="ts">
  import { X } from "$/assets/icons";
  import { cn } from "$/utils/style";
  import Info from "@lucide/svelte/icons/info";
  import CircleCheck from "@lucide/svelte/icons/circle-check";
  import TriangleAlert from "@lucide/svelte/icons/triangle-alert";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";
  import Loader2 from "@lucide/svelte/icons/loader-2";

  let {
    title,
    description,
    variant = "info",
    dismissible = true,
    onDismiss,
    position = "bottom-right",
    action,
    class: className,
    isLoading = false,
  }: ToastProps = $props();

  const variantConfig = {
    info: {
      icon: Info,
      iconClass: "text-blue-500",
    },
    success: {
      icon: CircleCheck,
      iconClass: "text-emerald-500",
    },
    warning: {
      icon: TriangleAlert,
      iconClass: "text-amber-500",
    },
    error: {
      icon: CircleAlert,
      iconClass: "text-red-500",
    },
  };

  const positionClasses = {
    "top-left": "fixed top-4 left-4",
    "top-right": "fixed top-4 right-4",
    "bottom-left": "fixed bottom-4 left-4",
    "bottom-right": "fixed bottom-4 right-4",
    "top-center": "fixed top-4 left-1/2 -translate-x-1/2",
    "bottom-center": "fixed bottom-4 left-1/2 -translate-x-1/2",
  };

  const config = $derived(variantConfig[variant]);
  const IconComponent = $derived(isLoading ? Loader2 : config.icon);
</script>

<div
  role="status"
  aria-live="polite"
  class={cn(
    "border-border bg-background z-100 max-w-100 rounded-lg border p-4 shadow-lg shadow-black/5",
    positionClasses[position],
    className,
  )}
>
  <div class="flex gap-3">
    <IconComponent
      class={cn(
        "shrink-0 self-start",
        isLoading ? "animate-spin" : "",
        config.iconClass,
      )}
      size={16}
      aria-hidden="true"
    />
    <div class="flex grow flex-col gap-2">
      <div class="space-y-1">
        <p class="text-sm font-medium leading-none">{title}</p>
        {#if description}
          <p class="text-muted-foreground text-sm">
            {#if typeof description === "string"}
              {description}
            {:else}
              {@render description()}
            {/if}
          </p>
        {/if}
      </div>
      {#if action}
        <div class="flex gap-2">
          <button
            type="button"
            class="text-sm font-medium hover:underline focus-visible:outline-none focus-visible:underline"
            onclick={action.onClick}
          >
            {action.label}
          </button>
        </div>
      {/if}
    </div>
    {#if dismissible}
      <button
        type="button"
        class="group -my-1.5 -me-2 size-8 shrink-0 rounded-sm p-0 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onclick={onDismiss}
        aria-label="Close notification"
      >
        <X class="h-4 w-4" aria-hidden="true" />
      </button>
    {/if}
  </div>
</div>
