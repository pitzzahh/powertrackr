<script module lang="ts">
  interface LandingNavProps {
    user: App.Locals["user"];
    session: App.Locals["session"];
  }
</script>

<script lang="ts">
  import { resolve } from "$app/paths";
  import Logo from "$/components/logo.svelte";
  import { Button } from "$/components/ui/button";
  import { LANDING_NAV_ITEMS, handleLandingNavClick } from ".";

  let { user, session }: LandingNavProps = $props();

  let scrollY = $state(0);
  const isFloating = $derived(scrollY > 50);

  const { fullyAuthenticated, needs2FA } = $derived({
    fullyAuthenticated:
      user &&
      session &&
      (user.isOauthUser || user.emailVerified) &&
      (!user.registeredTwoFactor || session.twoFactorVerified),
    needs2FA: user && user.registeredTwoFactor && (!session || !session.twoFactorVerified),
  });
</script>

<svelte:window bind:scrollY />

<div class="h-18">
  <header
    class="fixed inset-x-0 z-50 transition-all duration-300 ease-out"
    style:top={isFloating ? "0.75rem" : "0"}
    style:padding-left={isFloating ? "1rem" : "0"}
    style:padding-right={isFloating ? "1rem" : "0"}
  >
    <div
      class={[
        "relative mx-auto grid w-full items-center gap-4 border-border/50 bg-background/70 px-4 backdrop-blur-lg transition-all duration-300 ease-out md:grid-cols-[auto_1fr_auto]",
        isFloating ? "border shadow-lg shadow-black/10" : "border-b",
      ]}
      style:max-width={isFloating ? "95%" : "100%"}
      style:border-radius={isFloating ? "1rem" : "0"}
      style:padding-top={isFloating ? "0.6rem" : "0.9rem"}
      style:padding-bottom={isFloating ? "0.6rem" : "0.9rem"}
      style:box-shadow={isFloating ? "0 12px 28px -16px rgb(0 0 0 / 0.35)" : "none"}
    >
      <div class="flex items-center gap-3">
        <Logo variant="ghost" class="w-auto px-0 md:pl-0!" viewTransitionName="logo" />
        <span
          class="hidden items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[10px] font-medium tracking-[0.3em] text-muted-foreground uppercase sm:inline-flex"
        >
          <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
          System Online
        </span>
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

      <div class="flex items-center justify-end gap-2">
        {#if fullyAuthenticated}
          <Button data-sveltekit-reload href={resolve("/dashboard")} class="hidden sm:inline-flex"
            >Go to Dashboard</Button
          >
        {:else if needs2FA}
          <Button
            data-sveltekit-reload
            href={resolve("/auth?act=2fa-checkpoint")}
            class="hidden sm:inline-flex"
          >
            Verify Two-Factor Authentication
          </Button>
        {:else}
          <Button
            data-sveltekit-reload
            variant="outline"
            href={resolve("/auth?act=login")}
            class="hidden sm:inline-flex">Sign In</Button
          >
          <Button
            data-sveltekit-reload
            href={resolve("/auth?act=register")}
            class="hidden sm:inline-flex">Get Started</Button
          >
        {/if}
      </div>
    </div>
  </header>
</div>
