<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn } from "#lib/cn.js";
import { inputOtp } from "./variants";

let {
	ref = $bindable(null),
	class: classProp,
	children,
	...rest
}: HTMLAttributes<HTMLDivElement> & { ref?: HTMLDivElement | null } = $props();
</script>

<div bind:this={ref} data-slot="input-otp-group" class={cn(inputOtp().group(), classProp)} {...rest}>
	{@render children?.()}
</div>
