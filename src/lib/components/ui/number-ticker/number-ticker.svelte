<script module lang="ts">
  export type NumberTickerProps = {
		value: number;
		initial?: number;
		format?:Format;
		suffix?: string;
		prefix?: string;
		decimalPlaces?: number;
		delay?: number;
		class?: string;
	}
</script>

<script lang="ts">
	import NumberFlow, { continuous, type Format } from '@number-flow/svelte'

	let {
		value = 0,
		initial = 0,
		format,
		suffix = '',
		prefix = '',
		decimalPlaces = 0,
		delay = 0,
		class: className
	}: NumberTickerProps = $props();

	let { isVisible, targetValue } = $derived({
      isVisible: false,
      targetValue: value
	})

	let delayTimeout: ReturnType<typeof setTimeout> | null = null;

	function observe(node: HTMLElement) {
		targetValue = initial;

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];

				if (entry.isIntersecting && !isVisible) {
					// Element entered viewport
					isVisible = true;

					// Add delay to sync with ScrollStagger animations
					const delayMs = delay * 1000;

					delayTimeout = setTimeout(() => {
						targetValue = value;
					}, delayMs);
				} else if (!entry.isIntersecting && isVisible) {
					// Element left viewport - reset for next scroll
					isVisible = false;

					// Clear any pending timeout
					if (delayTimeout) {
						clearTimeout(delayTimeout);
						delayTimeout = null;
					}

					// Reset to initial value
					targetValue = initial;
				}
			},
			{ threshold: 0.1 }
		);

		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
				if (delayTimeout) {
					clearTimeout(delayTimeout);
				}
			}
		};
	}
</script>

<span use:observe class='tabular-nums tracking-tight text-foreground'>
  <NumberFlow
   class={className}
    {format} {suffix} {prefix} plugins={[continuous]}
		value={targetValue ? decimalPlaces > 0
			? Number(targetValue.toFixed(decimalPlaces))
			: Math.round(targetValue) : 0}
/>
</span>
