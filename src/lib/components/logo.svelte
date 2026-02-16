<script lang="ts" module>
  type LogoProps = {
    href?: ButtonProps["href"];
    variant?: ButtonVariant;
    size?: ButtonSize;
    class?: string;
    viewTransitionName?: string;
  };
</script>

<script lang="ts">
  import { site } from "$/site";
  import Button, {
    type ButtonProps,
    type ButtonSize,
    type ButtonVariant,
  } from "$/components/ui/button/button.svelte";
  import { cn } from "$/utils/style";
  import { Zap } from "$/assets/icons";

  let {
    href = "/",
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
  {...restProps}
>
  <Zap class="size-6 text-primary-foreground dark:text-primary" />
  <span class="mr-1 text-3xl leading-none font-bold">
    <span class="text-foreground">{site.name.substring(0, 5)}</span><span
      class="text-primary-foreground dark:text-primary">{site.name.substring(5)}</span
    >
  </span>
</Button>
