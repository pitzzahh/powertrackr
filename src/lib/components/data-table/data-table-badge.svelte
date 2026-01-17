<script lang="ts">
  import { Badge } from "$/components/ui/badge";
  import type { BadgeVariant } from "$/components/ui/badge";
  import { cn } from "$/utils/style";

  interface Props {
    value: boolean | string | number | null;
    variant?: BadgeVariant;
    className?: string;
  }

  let { value, className, variant = "default" }: Props = $props();
</script>

<Badge {variant} class={cn("text-ellipsis whitespace-nowrap", className)}>{value}</Badge>
