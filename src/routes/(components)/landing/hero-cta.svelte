<script lang="ts">
  import { Button } from "#lib/components/ui/button/index.js";
  import { ButtonSkeleton } from "#lib/components/snippets.svelte";
  import { getCurrentUser } from "#lib/api/user.remote.js";
  import { browser } from "$app/env";

  const authQuery = browser ? getCurrentUser() : null;
  const { user, session } = $derived(authQuery?.current ?? { user: null, session: null });

  const fullyAuthenticated = $derived(
    !!user &&
      !!session &&
      user.emailVerified &&
      (!user.registeredTwoFactor || session.twoFactorVerified)
  );
  const needs2FA = $derived(!!user?.registeredTwoFactor && !session?.twoFactorVerified);
</script>

<div class="mt-8 flex flex-col gap-3 sm:flex-row">
  {#if fullyAuthenticated}
    <Button data-sveltekit-reload size="lg" href="/dashboard">Go to dashboard</Button>
  {:else if needs2FA}
    <Button size="lg" href="/auth?act=2fa-checkpoint">Verify two-factor authentication</Button>
  {:else if authQuery?.loading}
    {@render ButtonSkeleton({ size: "lg" })}
  {:else}
    <Button size="lg" href="/auth?act=register">Create an account</Button>
    <Button size="lg" variant="outline" href="/auth?act=login">Sign in</Button>
  {/if}
</div>
