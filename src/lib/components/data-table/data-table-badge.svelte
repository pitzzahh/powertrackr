<script lang="ts">
  import { Badge } from "#lib/components/ui/badge/index.js";
  import type { BadgeVariant } from "#lib/components/ui/badge/index.js";
  import { cn } from "#lib/utils/style.js";

  interface Props {
    value: boolean | string | number | null;
    variant?: BadgeVariant;
    className?: string;
  }

  let { value, className, variant = "default" }: Props = $props();
</script>

<Badge {variant} class={cn("text-ellipsis whitespace-nowrap", className)}>{value}</Badge>
