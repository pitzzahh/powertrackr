<script lang="ts">
  import { resolve } from "$app/paths";
  import { browser } from "$app/env";
  import Logo from "#lib/components/logo.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import { ButtonSkeleton } from "#lib/components/snippets.svelte";
  import { getCurrentUser } from "#lib/api/user.remote.js";
  import { LANDING_NAV_ITEMS, handleLandingNavClick } from ".";

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

<header class="sticky top-0 z-50 border-b bg-background">
  <div class="container mx-auto flex h-16 items-center gap-8 px-4">
    <Logo variant="ghost" class="w-auto px-0 md:pl-0!" viewTransitionName="logo" />

    <nav aria-label="Main" class="hidden md:block">
      <ul class="flex gap-6 text-sm text-muted-foreground">
        {#each LANDING_NAV_ITEMS as item (item.href)}
          <li>
            <a
              href={resolve(item.href)}
              onclick={(e) => handleLandingNavClick(e, item.href)}
              class="hover:text-foreground"
            >
              {item.label}
            </a>
          </li>
        {/each}
      </ul>
    </nav>

    <div class="ml-auto hidden items-center gap-2 sm:flex">
      {#if fullyAuthenticated}
        <Button href={resolve("dashboard")} data-sveltekit-reload>Go to dashboard</Button>
      {:else if needs2FA}
        <Button href={resolve("auth?act=2fa-checkpoint")}>Verify two-factor</Button>
      {:else if authQuery?.loading}
        {@render ButtonSkeleton()}
      {:else}
        <Button variant="ghost" href={resolve("auth?act=login")}>Sign in</Button>
        <Button href={resolve("auth?act=register")}>Create an account</Button>
      {/if}
    </div>
  </div>
</header>
