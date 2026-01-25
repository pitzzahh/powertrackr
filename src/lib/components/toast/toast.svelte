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

  const VARIANT_CONFIG = {
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

  const POSITION_CLASSES = {
    "top-left": "fixed top-4 left-4",
    "top-right": "fixed top-4 right-4",
    "bottom-left": "fixed bottom-4 left-4",
    "bottom-right": "fixed bottom-4 right-4",
    "top-center": "fixed top-4 left-1/2 -translate-x-1/2",
    "bottom-center": "fixed bottom-4 left-1/2 -translate-x-1/2",
  };
</script>

<script lang="ts">
  import { X, Info, CircleCheck, TriangleAlert, CircleAlert, Loader } from "$/assets/icons";
  import { cn } from "$/utils/style";

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

  const config = $derived(VARIANT_CONFIG[variant]);
  const IconComponent = $derived(isLoading ? Loader : config.icon);
</script>

<div
  role="status"
  aria-live="polite"
  class={cn(
    "z-100 max-w-100 rounded-lg border border-border bg-background p-4 shadow-lg shadow-black/5",
    POSITION_CLASSES[position],
    className
  )}
>
  <div class="flex gap-3">
    <IconComponent
      class={[
        config.iconClass,
        {
          "selft-start shrink-0": true,
          "animate-spin": isLoading,
        },
      ]}
      size={16}
      aria-hidden="true"
    />
    <div class="flex grow flex-col gap-2">
      <div class="space-y-1">
        <p class="text-sm leading-none font-medium">{title}</p>
        {#if description}
          <p class="text-sm text-muted-foreground">
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
            class="text-sm font-medium hover:underline focus-visible:underline focus-visible:outline-none"
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
        class="group -my-1.5 -me-2 size-8 shrink-0 rounded-sm p-0 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        onclick={onDismiss}
        aria-label="Close notification"
      >
        <X class="h-4 w-4" aria-hidden="true" />
      </button>
    {/if}
  </div>
</div>
