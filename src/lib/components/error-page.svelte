<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="container grid grid-rows-2 place-items-center">
	<img src="error-404.png" alt="error img illustration" />
	<h1>{$page.status}: {$page.error?.message}</h1>
</div>

