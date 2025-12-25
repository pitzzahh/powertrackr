<script module lang="ts">
  import type { Snippet } from "svelte";

  export interface ToastProps {
    icon?: typeof Icon;
    title: string;
    class?: string;
    description?: string | Snippet;
    variant?: AlertVariant;
    dismissible?: boolean;
    onDismiss?: () => void;
  }
</script>

<script lang="ts">
  import type { Icon } from "@lucide/svelte";
  import * as Alert from "$/components/ui/alert/index.js";
  import CheckCircle2Icon from "@lucide/svelte/icons/check-circle-2";
  import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";
  import { X } from "$/assets/icons";
  import type { AlertVariant } from "$/components/ui/alert/index.js";
  import { cn } from "$/utils/style";
  let {
    icon,
    title = "test",
    class: className,
    description,
    variant = "default",
    dismissible = false,
    onDismiss,
  }: ToastProps = $props();
</script>

<Alert.Root {variant} class={cn("w-full text-nowrap relative", className)}>
  {#if icon}
    <icon></icon>
  {:else if variant === "default"}
    <CheckCircle2Icon color="var(--primary)" />
  {:else}
    <AlertCircleIcon />
  {/if}
  <Alert.Title class="select-none">{title}</Alert.Title>
  {#if description}
    <Alert.Description class="select-none">
      {#if typeof description === "string"}
        {description}
      {:else}
        {@render description()}
      {/if}
    </Alert.Description>
  {/if}
  {#if dismissible}
    <button
      type="button"
      class="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
      onclick={onDismiss}
    >
      <X class="h-4 w-4" />
      <span class="sr-only">Close</span>
    </button>
  {/if}
</Alert.Root>
