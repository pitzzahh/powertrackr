<script lang="ts">
	import illustration from '$lib/assets/illustrations/hero.svg';
	import { siteConfig } from '$lib/config/site';
	import { Button } from '$lib/components/ui/button';

	$: {
		console.log('illustration', illustration);
	}
</script>

<div class="container">
	<div class=" flex items-center justify-center lg:-translate-y-28">
		<div class="flex flex-col gap-10">
			<h1 class="mt-10 text-wrap text-center sm:text-left">{siteConfig.description}</h1>
			<Button href="/auth/register">Get Started</Button>
		</div>
		<img
			src={illustration}
			alt="illustration"
			class="md:h[40rem] hidden sm:block sm:h-[20rem] lg:h-[50rem]"
		/>
	</div>
	<div></div>
</div>
