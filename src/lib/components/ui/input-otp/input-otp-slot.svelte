<script lang="ts">
import { PinInput as InputOTPPrimitive } from "bits-ui";
import { cn } from "#lib/cn.js";
import { inputOtp } from "./variants";
import { getInputOtpStyle } from "./context";

let {
	ref = $bindable(null),
	cell,
	class: classProp,
	...rest
}: InputOTPPrimitive.CellProps = $props();

const s = $derived(inputOtp(getInputOtpStyle()));
</script>

<InputOTPPrimitive.Cell {cell} bind:ref data-slot="input-otp-slot" class={cn(s.slot(), classProp)} {...rest}>
	{#if cell.char}
		{#key cell.char}<span class={s.value()}>{cell.char}</span>{/key}
	{/if}
	{#if cell.hasFakeCaret}
		<div class={s.caret()}>
			<div class={s.caretLine()}></div>
		</div>
	{/if}
</InputOTPPrimitive.Cell>
