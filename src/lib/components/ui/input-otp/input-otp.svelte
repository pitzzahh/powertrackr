<script lang="ts">
import { PinInput as InputOTPPrimitive } from "bits-ui";
import { cn } from "#lib/cn.js";
import { type InputOtpInvalidMotion, type InputOtpSize, inputOtp } from "./variants";
import { setInputOtpStyle } from "./context";

let {
	ref = $bindable(null),
	value = $bindable(""),
	size = "default",
	invalid = false,
	invalidMotion = "shake",
	class: classProp,
	...rest
}: Omit<InputOTPPrimitive.RootProps, "size"> & {
	size?: InputOtpSize;
	/** Reds every slot; `invalidMotion` plays each time this turns on. */
	invalid?: boolean;
	invalidMotion?: InputOtpInvalidMotion;
} = $props();

setInputOtpStyle(() => ({ size, invalid, invalidMotion }));
const s = $derived(inputOtp({ size, invalid, invalidMotion }));
</script>

<!-- One real input under the slots, so paste and one-time-code autofill work natively. -->
<InputOTPPrimitive.Root
	bind:ref
	bind:value
	data-slot="input-otp"
	aria-invalid={invalid || undefined}
	spellcheck={false}
	autocomplete="one-time-code"
	class={cn(s.root(), s.input(), classProp)}
	{...rest}
/>
