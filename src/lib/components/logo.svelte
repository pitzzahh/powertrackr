<script lang="ts" module>
  type LogoProps = {
    variant?: ButtonVariant;
    size?: ButtonSize;
    class?: string;
  };
</script>

<script lang="ts">
  import { site } from "$/site";
  import Button, {
    type ButtonSize,
    type ButtonVariant,
  } from "$/components/ui/button/button.svelte";
  import { cn } from "$/utils/style";
  import { Zap } from "$/assets/icons";

  let {
    class: className,
    variant = "default",
    size = "default",
    ...restProps
  }: LogoProps = $props();
</script>

<Button
  href="/"
  aria-label="Homepage"
  style="view-transition-name: logo;"
  class={cn(
    "space-between flex cursor-pointer items-center justify-center rounded-sm text-primary",
    className
  )}
  {size}
  {variant}
  {...restProps}
>
  <Zap class="size-6" />
  <span class="mr-1 text-3xl leading-0 font-bold">
    <span class="text-foreground">{site.name.substring(0, 5)}</span><span class="text-primary"
      >{site.name.substring(5, site.name.length)}
    </span>
  </span>
</Button>
