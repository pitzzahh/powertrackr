<script lang="ts">
  import { resolve } from "$app/paths";
  import Logo from "#lib/components/logo.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import { LANDING_NAV_ITEMS, handleLandingNavClick } from ".";
  import { getCurrentUser } from "#lib/api/user.remote.js";
  import { ButtonSkeleton } from "#lib/components/snippets.svelte";
  import { browser } from "$app/env";

  const authQuery = browser ? getCurrentUser() : null;
  const { user, session } = $derived(authQuery?.current ?? { user: null, session: null });

  const { fullyAuthenticated, needs2FA } = $derived({
    fullyAuthenticated:
      user &&
      session &&
      (user.isOauthUser || user.emailVerified) &&
      (!user.registeredTwoFactor || session.twoFactorVerified),
    needs2FA: user && user.registeredTwoFactor && (!session || !session.twoFactorVerified),
  });
</script>

<div class="h-18">
  <header
    class="fixed inset-x-0 z-50 h-18 border-b border-border/50 bg-background/70 backdrop-blur-lg"
  >
    <div
      class="relative mx-auto grid h-full w-full items-center gap-4 px-4 md:grid-cols-[auto_1fr_auto]"
    >
      <div class="flex w-full items-center justify-center gap-3 md:w-auto md:justify-start">
        <Logo variant="ghost" class="w-auto px-0 md:pl-0!" viewTransitionName="logo" />
      </div>

      <nav class="absolute left-1/2 hidden -translate-x-1/2 md:flex md:items-center">
        <ul class="flex items-center px-0.5 py-0.5">
          {#each LANDING_NAV_ITEMS as item (item.href)}
            <li>
              <a
                href={resolve(item.href)}
                onclick={(e) => handleLandingNavClick(e, item.href)}
                class="rounded-2xl px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {item.label}
              </a>
            </li>
          {/each}
        </ul>
      </nav>

      <div class="hidden items-center justify-end gap-2 sm:flex">
        {#if fullyAuthenticated}
          <Button href={resolve("dashboard")} data-sveltekit-reload class="inline-flex"
            >Go to Dashboard</Button
          >
        {:else if needs2FA}
          <Button href={resolve("auth?act=2fa-checkpoint")} class="inline-flex"
            >Verify Two-Factor Authentication</Button
          >
        {:else if authQuery?.loading}
          {@render ButtonSkeleton()}
        {:else}
          <Button variant="outline" href={resolve("auth?act=login")} class="inline-flex"
            >Sign In</Button
          >

          <Button href={resolve("auth?act=register")} class="inline-flex">Get Started</Button>
        {/if}
      </div>
    </div>
  </header>
</div>
