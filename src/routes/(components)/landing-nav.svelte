<script module lang="ts">
  interface LandingNavProps {
    user: App.Locals["user"];
    session: App.Locals["session"];
  }
</script>

<script lang="ts">
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
        "mx-auto flex items-center justify-between border-border/50 bg-background/50 px-4 backdrop-blur-lg transition-all duration-300 ease-out",
        isFloating ? "border" : "border-b",
      ]}
      style:max-width={isFloating ? "70%" : "100%"}
      style:border-radius={isFloating ? "1rem" : "0"}
      style:padding-top={isFloating ? "0.75rem" : "1rem"}
      style:padding-bottom={isFloating ? "0.75rem" : "1rem"}
      style:box-shadow={isFloating
        ? "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
        : "none"}
    >
      <Logo
        variant="ghost"
        class="mx-auto w-1/2 px-0 md:m-0 md:w-fit md:pl-0!"
        viewTransitionName="logo"
      />

      <!-- Centered nav items - hidden on mobile, visible on md+ -->
      <nav class="absolute left-1/2 hidden -translate-x-1/2 md:flex">
        <ul class="flex items-center gap-1">
          {#each LANDING_NAV_ITEMS as item}
            <li>
              <a
                href={item.href}
                onclick={(e) => handleLandingNavClick(e, item.href)}
                class="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {item.label}
              </a>
            </li>
          {/each}
        </ul>
      </nav>

      <div class="flex gap-2">
        {#if fullyAuthenticated}
          <Button href="/dashboard" class="hidden sm:inline-flex">Go to Dashboard</Button>
        {:else if needs2FA}
          <Button href="/auth?act=2fa-checkpoint" class="hidden sm:inline-flex">
            Verify Two-Factor Authentication
          </Button>
        {:else}
          <Button variant="outline" href="/auth?act=login" class="hidden sm:inline-flex"
            >Sign In</Button
          >
          <Button href="/auth?act=register" class="hidden sm:inline-flex">Get Started</Button>
        {/if}
      </div>
    </div>
  </header>
</div>
