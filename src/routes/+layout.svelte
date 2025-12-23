<script lang="ts">
	import "./layout.css";
	import { ModeWatcher } from "mode-watcher";
	import favicon from "$lib/assets/favicon.svg";

	const { children } = $props();
</script>

<ModeWatcher/>

<svelte:head>
	<link rel="icon" href={favicon}>
</svelte:head>
{@render children()}
