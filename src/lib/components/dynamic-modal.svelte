<script lang="ts">
  import * as Sheet from "#lib/components/ui/sheet/index.js";
  import * as Dialog from "#lib/components/ui/dialog/index.js";
  import { IsMobile } from "#lib/hooks/is-mobile.svelte.js";
  import type { Snippet } from "svelte";

  const isMobile = new IsMobile();

  /**
   * A reusable dialog that adapts between Sheet (mobile) and Dialog (desktop).
   * Follows the same pattern as `dynamic-tooltip.svelte`.
   *
   * When a `trigger` snippet is provided, it wraps the trigger element so that
   * clicking it opens the dialog/sheet. The trigger receives a `props` object with
   * accessible and event-handler attributes that should be spread onto a trigger element.
   *
   * When no trigger is provided, the dialog/sheet is controlled programmatically
   * via `bind:open`.
   *
   * @example
   * ```svelte
   * <!-- Programmatic control -->
   * <DynamicModal bind:open={showDetails} title="Details">
   *     {@render content()}
   * </DynamicModal>
   *
   * <!-- With trigger snippet -->
   * <DynamicModal title="Details">
   *     {#snippet trigger({ props })}
   *         <button {...props}>Open</button>
   *     {/snippet}
   *     {@render content()}
   * </DynamicModal>
   * ```
   */
  let {
    open = $bindable(false),
    onOpenChange,
    title = "",
    description = "",
    sheetSide = "left" as "left" | "right" | "top" | "bottom",
    dialogClass = "md:max-w-lg",
    sheetClass = "",
    contentClass = "flex flex-col overflow-y-auto",
    children,
    trigger,
    footer,
  }: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    title?: string;
    description?: string;
    sheetSide?: "left" | "right" | "top" | "bottom";
    dialogClass?: string;
    sheetClass?: string;
    contentClass?: string;
    children?: Snippet;
    trigger?: Snippet<[{ props: Record<string, unknown> }]>;
    footer?: Snippet;
  } = $props();

  function setOpen(value: boolean) {
    open = value;
    onOpenChange?.(value);
  }
</script>

{#if isMobile.current}
  <Sheet.Root bind:open={() => open, setOpen}>
    {#if trigger}
      <Sheet.Trigger>
        {#snippet child({ props })}
          {@render trigger({ props })}
        {/snippet}
      </Sheet.Trigger>
    {/if}
    <Sheet.Content
      side={sheetSide}
      class={[
        {
          "flex h-dvh flex-col gap-0 overflow-hidden":
            sheetSide === "bottom" || sheetSide === "top",
          "flex h-full min-w-full flex-col gap-0 overflow-hidden":
            sheetSide === "left" || sheetSide === "right",
        },
        sheetClass,
      ]}
    >
      {#if title}
        <Sheet.Header class="border-b px-4 py-4">
          <Sheet.Title>{title}</Sheet.Title>
          {#if description}
            <Sheet.Description>{description}</Sheet.Description>
          {/if}
        </Sheet.Header>
      {/if}
      <div class="min-h-0 flex-1 p-4 {contentClass}">
        {@render children?.()}
      </div>
      {#if footer}
        <div class="shrink-0 p-2">
          {@render footer()}
        </div>
      {/if}
    </Sheet.Content>
  </Sheet.Root>
{:else}
  <Dialog.Root bind:open={() => open, setOpen}>
    {#if trigger}
      <Dialog.Trigger>
        {#snippet child({ props })}
          {@render trigger({ props })}
        {/snippet}
      </Dialog.Trigger>
    {/if}
    <Dialog.Content
      class={["flex max-h-[86vh] flex-col gap-1.5 overflow-hidden", dialogClass]
        .filter(Boolean)
        .join(" ")}
    >
      {#if title}
        <Dialog.Header>
          <Dialog.Title>{title}</Dialog.Title>
          {#if description}
            <Dialog.Description>{description}</Dialog.Description>
          {/if}
        </Dialog.Header>
      {/if}
      <div class="min-h-0 flex-1 {contentClass}">
        {@render children?.()}
      </div>
      {#if footer}
        <div class="shrink-0">
          {@render footer()}
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Root>
{/if}
