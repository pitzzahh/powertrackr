<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn } from "#lib/cn.js";
import { type ButtonGroupOrientation, buttonGroup } from "./variants";

let {
	ref = $bindable(null),
	class: classProp,
	children,
	orientation = "horizontal",
	...rest
}: HTMLAttributes<HTMLDivElement> & {
	ref?: HTMLDivElement | null;
	orientation?: ButtonGroupOrientation;
} = $props();
</script>

<div
	bind:this={ref}
	role="group"
	data-slot="button-group"
	data-orientation={orientation}
	class={cn(buttonGroup({ orientation }).root(), classProp)}
	{...rest}
>
	{@render children?.()}
</div>
