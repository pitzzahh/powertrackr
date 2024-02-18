<script lang="ts">
	import illustration from '$lib/assets/illustrations/hero.svg';
	import { Button } from '$lib/components/ui/button';
	import { app_desc, get_started } from '$paraglide/messages';
</script>

<div>
	<div class="flex items-center justify-center">
		<div class="flex flex-col gap-10">
			<h1 class="text-wrap text-center sm:text-left">{app_desc()}</h1>
			<Button href="/auth/register">{get_started()}</Button>
		</div>
		<img
			src={illustration}
			alt="illustration"
			class="md:h[34rem] hidden sm:block sm:h-[20rem] lg:h-[44rem]"
		/>
	</div>
	<div></div>
</div>
