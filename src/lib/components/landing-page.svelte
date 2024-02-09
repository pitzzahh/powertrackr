<script lang="ts">
	import illustration from '$lib/assets/illustrations/hero.svg';
	import { Button } from '$lib/components/ui/button';
	import { app_desc, get_started } from '$paraglide/messages';
</script>

<div class="container">
	<div class=" flex items-center justify-center lg:-translate-y-28">
		<div class="flex flex-col gap-10">
			<h1 class="mt-10 text-wrap text-center sm:text-left">{app_desc()}</h1>
			<Button href="/auth/register">{get_started()}</Button>
		</div>
		<img
			src={illustration}
			alt="illustration"
			class="md:h[40rem] hidden sm:block sm:h-[20rem] lg:h-[50rem]"
		/>
	</div>
	<div></div>
</div>
