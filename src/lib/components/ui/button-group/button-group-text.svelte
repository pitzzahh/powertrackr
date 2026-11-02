<script lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { cn } from "#lib/cn.js";
import { buttonGroup } from "./variants";

let {
	ref = $bindable(null),
	class: classProp,
	child,
	children,
	...rest
}: HTMLAttributes<HTMLDivElement> & {
	ref?: HTMLDivElement | null;
	child?: Snippet<[{ props: Record<string, unknown> }]>;
} = $props();

const merged = $derived({
	...rest,
	class: cn(buttonGroup().text(), classProp),
	"data-slot": "button-group-text",
});
</script>

{#if child}
	{@render child({ props: merged })}
{:else}
	<div bind:this={ref} {...merged}>{@render children?.()}</div>
{/if}
