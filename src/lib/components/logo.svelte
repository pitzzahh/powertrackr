<script lang="ts" module>
  type LogoProps = {
    href?: ButtonProps["href"];
    variant?: ButtonVariant;
    size?: ButtonSize;
    class?: string;
    onclick?: ButtonProps["onclick"];
    viewTransitionName?: string;
  };
</script>

<script lang="ts">
  import { site } from "#lib/site.js";
  import Button, {
    type ButtonProps,
    type ButtonSize,
    type ButtonVariant,
  } from "#lib/components/ui/button/button.svelte";
  import { cn } from "#lib/utils/style.js";
  import { Zap } from "#lib/assets/icons.js";

  let {
    href = "/",
    onclick,
    class: className,
    variant = "default",
    size = "default",
    viewTransitionName = "logo",
    ...restProps
  }: LogoProps = $props();
</script>

<Button
  {href}
  aria-label="Homepage"
  style="view-transition-name: {viewTransitionName};"
  class={cn("flex cursor-pointer items-center justify-center rounded-sm", className)}
  {size}
  {variant}
  {onclick}
  {...restProps}
>
  <span class="grid size-7 place-items-center rounded-sm bg-highlight text-highlight-foreground">
    <Zap class="size-4" weight="fill" />
  </span>
  <span class="mr-1 text-xl leading-none font-semibold tracking-tight text-foreground">
    {site.name}
  </span>
</Button>
