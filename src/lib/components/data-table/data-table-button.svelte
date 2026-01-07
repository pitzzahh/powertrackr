<script lang="ts">
  import { buttonVariants, type ButtonVariant } from "$/components/ui/button";
  import * as Tooltip from "$/components/ui/tooltip";
  import { goto } from "$app/navigation";
  import { ArrowUpRight } from "$/assets/icons";
  import { cn } from "$/utils/style";

  interface DataTableButtonProps {
    content: string;
    href: string | undefined;
    variant: ButtonVariant;
    [key: string]: any;
  }

  let {
    content,
    href,
    variant = "default",
    ...rest
  }: DataTableButtonProps = $props();
</script>

{#key content}
  <Tooltip.Provider>
    <Tooltip.Root delayDuration={200}>
      <Tooltip.Trigger
        onclick={async () => {
          if (!href) return;
          await goto(href);
        }}
        class={cn(
          buttonVariants({
            variant,
            size: "icon",
          }),
          {
            "group relative inline-flex items-center": href,
          },
        )}
        {...rest}
      >
        {content}
        {#if href}
          <ArrowUpRight
            size="1rem"
            class="transform opacity-0 transition-all duration-300 ease-in-out group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:opacity-100"
          />
        {/if}
      </Tooltip.Trigger>
      <Tooltip.Content>
        {#if href}
          Go to {content}
        {:else}
          {content}
        {/if}
      </Tooltip.Content>
    </Tooltip.Root>
  </Tooltip.Provider>
{/key}
