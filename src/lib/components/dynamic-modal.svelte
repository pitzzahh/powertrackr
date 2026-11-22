<script lang="ts" module>
  import { getContext, onMount, setContext, type Snippet } from "svelte";

  const FOOTER_KEY = Symbol("dynamic-modal-footer");
  type FooterRegistry = { push: (footer: Snippet) => () => void };

  /**
   * Render `footer` in the enclosing DynamicModal's footer band while the
   * calling component is mounted. Lets a form inside the modal put its action
   * buttons in the footer (give them `form="<form id>"`, since they sit
   * outside the <form>). Call during component init; the latest mount wins.
   */
  export function useModalFooter(footer: Snippet) {
    const registry = getContext<FooterRegistry | undefined>(FOOTER_KEY);
    onMount(() => registry?.push(footer));
  }

  /**
   * sm/md grow with their content (confirmations, short forms).
   * lg/xl keep one width AND height, so the header and any tab bar stay put
   * while the body scrolls, however tall each tab's content is.
   */
  export type DynamicModalSize = "sm" | "md" | "lg" | "xl";

  export type DynamicModalProps = {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    title?: string;
    description?: string;
    size?: DynamicModalSize;
    sheetSide?: "left" | "right" | "top" | "bottom";
    dialogClass?: string;
    sheetClass?: string;
    contentClass?: string;
    children?: Snippet;
    trigger?: Snippet<[{ props: Record<string, unknown> }]>;
    footer?: Snippet;
  };

  // Header, body and footer are separate bands: the body scrolls between a
  // bordered header and a recessed footer, so each region reads at a glance.
  const HEADER = "shrink-0 gap-1 border-b border-border/70 px-6 py-4";
  const BODY = "min-h-0 flex-1 py-5";
  const FOOTER = "shrink-0 border-t border-border/70 bg-(--modal-footer) py-3";

  const DIALOG_SIZE: Record<DynamicModalSize, string> = {
    sm: "w-[min(28rem,calc(100vw-2rem))]",
    md: "w-[min(40rem,calc(100vw-2rem))]",
    lg: "w-[min(60rem,calc(100vw-2rem))] h-[min(85vh,48rem)]",
    xl: "w-[min(76rem,calc(100vw-2rem))] h-[min(85vh,52rem)]",
  };
</script>

<script lang="ts">
  import * as Sheet from "#lib/components/ui/sheet/index.js";
  import * as Dialog from "#lib/components/ui/dialog/index.js";
  import { IsMobile } from "#lib/hooks/is-mobile.svelte.js";
  import { cn } from "#lib/utils/style.js";

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
    size = "md",
    sheetSide = "left",
    dialogClass = "",
    sheetClass = "",
    contentClass = "flex flex-col overflow-y-auto",
    children,
    trigger,
    footer,
  }: DynamicModalProps = $props();

  let registered = $state<Snippet[]>([]);
  setContext<FooterRegistry>(FOOTER_KEY, {
    push(snippet) {
      registered = [...registered, snippet];
      return () => {
        registered = registered.filter((s) => s !== snippet);
      };
    },
  });
  const activeFooter = $derived(footer ?? registered.at(-1));

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
          "flex h-dvh flex-col gap-0 overflow-hidden p-0":
            sheetSide === "bottom" || sheetSide === "top",
          "flex h-full min-w-full flex-col gap-0 overflow-hidden p-0":
            sheetSide === "left" || sheetSide === "right",
        },
        sheetClass,
      ]}
    >
      {#if title}
        <Sheet.Header class={cn(HEADER, "flex-col items-start justify-start px-4 pe-12")}>
          <Sheet.Title>{title}</Sheet.Title>
          {#if description}
            <Sheet.Description>{description}</Sheet.Description>
          {/if}
        </Sheet.Header>
      {/if}
      {#if children}
        <div class={cn(BODY, "px-4", contentClass)}>
          {@render children()}
        </div>
      {/if}
      {#if activeFooter}
        <div class={cn(FOOTER, "px-4")}>
          {@render activeFooter()}
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
      class={cn(
        "flex max-h-[86vh] max-w-none flex-col gap-0 overflow-hidden p-0",
        DIALOG_SIZE[size],
        dialogClass
      )}
    >
      {#if title}
        <Dialog.Header class={cn(HEADER, "pe-12")}>
          <Dialog.Title>{title}</Dialog.Title>
          {#if description}
            <Dialog.Description>{description}</Dialog.Description>
          {/if}
        </Dialog.Header>
      {/if}
      {#if children}
        <div class={cn(BODY, "px-6", contentClass)}>
          {@render children()}
        </div>
      {/if}
      {#if activeFooter}
        <div class={cn(FOOTER, "px-6")}>
          {@render activeFooter()}
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Root>
{/if}
