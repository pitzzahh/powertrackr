<script lang="ts">
	import { navigating } from '$app/stores';

	let showSvg: boolean = false;
	let timer: NodeJS.Timeout;
	const timeoutDuration: number = 1000;

	$: {
		if ($navigating) {
			timer = setTimeout(() => {
				console.log('showing svg');
				showSvg = true;
			}, timeoutDuration);
		} else {
			console.log('clearing timeout');
			clearTimeout(timer);
			showSvg = false;
		}
	}
</script>

{#if $navigating && showSvg}
	<div class="fixed inset-0 z-[99999] flex h-screen items-center justify-center backdrop-blur-sm">
		<svg
			width="80"
			height="120"
			viewBox="0 0 135 120"
			xmlns="http://www.w3.org/2000/svg"
			fill="hsl(var(--primary) / 1)"
		>
			<rect y="10" width="15" height="120" rx="6">
				<animate
					attributeName="height"
					begin="0.5s"
					dur="1s"
					values="120;110;100;90;80;70;60;50;40;140;120"
					calcMode="linear"
					repeatCount="indefinite"
				/>
				<animate
					attributeName="y"
					begin="0.5s"
					dur="1s"
					values="10;15;20;25;30;35;40;45;50;0;10"
					calcMode="linear"
					repeatCount="indefinite"
				/>
			</rect>
			<rect x="30" y="10" width="15" height="120" rx="6">
				<animate
					attributeName="height"
					begin="0.25s"
					dur="1s"
					values="120;110;100;90;80;70;60;50;40;140;120"
					calcMode="linear"
					repeatCount="indefinite"
				/>
				<animate
					attributeName="y"
					begin="0.25s"
					dur="1s"
					values="10;15;20;25;30;35;40;45;50;0;10"
					calcMode="linear"
					repeatCount="indefinite"
				/>
			</rect>
			<rect x="60" width="15" height="120" rx="6">
				<animate
					attributeName="height"
					begin="0s"
					dur="1s"
					values="120;110;100;90;80;70;60;50;40;140;120"
					calcMode="linear"
					repeatCount="indefinite"
				/>
				<animate
					attributeName="y"
					begin="0s"
					dur="1s"
					values="10;15;20;25;30;35;40;45;50;0;10"
					calcMode="linear"
					repeatCount="indefinite"
				/>
			</rect>
			<rect x="90" y="10" width="15" height="120" rx="6">
				<animate
					attributeName="height"
					begin="0.25s"
					dur="1s"
					values="120;110;100;90;80;70;60;50;40;140;120"
					calcMode="linear"
					repeatCount="indefinite"
				/>
				<animate
					attributeName="y"
					begin="0.25s"
					dur="1s"
					values="10;15;20;25;30;35;40;45;50;0;10"
					calcMode="linear"
					repeatCount="indefinite"
				/>
			</rect>
			<rect x="120" y="10" width="15" height="120" rx="6">
				<animate
					attributeName="height"
					begin="0.5s"
					dur="1s"
					values="120;110;100;90;80;70;60;50;40;140;120"
					calcMode="linear"
					repeatCount="indefinite"
				/>
				<animate
					attributeName="y"
					begin="0.5s"
					dur="1s"
					values="10;15;20;25;30;35;40;45;50;0;10"
					calcMode="linear"
					repeatCount="indefinite"
				/>
			</rect>
		</svg>
	</div>
{/if}
