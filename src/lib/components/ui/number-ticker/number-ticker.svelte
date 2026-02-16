<script lang="ts">
	import { cn } from '$lib/utils/style';
	import { Spring } from 'svelte/motion';

	let {
		value = 0,
		initial = 0,
		format,
		suffix = '',
		prefix = '',
		decimalPlaces = 0,
		delay = 0,
		class: className
	}: {
		value: number;
		initial?: number;
		format?: (value: number) => string;
		suffix?: string;
		prefix?: string;
		decimalPlaces?: number;
		delay?: number;
		class?: string;
	} = $props();

	let isVisible = $state(false);
	let hasStarted = $state(false);
	let targetValue = $state(0);
	let delayTimeout: ReturnType<typeof setTimeout> | null = null;

	const count = Spring.of(() => targetValue, {
		stiffness: 0.1,
		damping: 0.4
	});

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
						hasStarted = true;
						targetValue = value;
					}, delayMs);
				} else if (!entry.isIntersecting && isVisible) {
					// Element left viewport - reset for next scroll
					isVisible = false;
					hasStarted = false;

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

	let displayValue = $derived.by(() => {
		const currentValue =
			decimalPlaces > 0
				? Number(count.current.toFixed(decimalPlaces))
				: Math.round(count.current);

		if (format) {
			return format(currentValue);
		}

		const formatted = currentValue.toLocaleString('en-US', {
			minimumFractionDigits: decimalPlaces,
			maximumFractionDigits: decimalPlaces
		});

		return `${prefix}${formatted}${suffix}`;
	});
</script>

<span use:observe class={cn('tabular-nums tracking-tight text-foreground', className)}>
	{displayValue}
</span>
