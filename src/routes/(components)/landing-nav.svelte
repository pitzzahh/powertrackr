<script lang="ts">
  import Logo from "$/components/logo.svelte";
  import { Button } from "$/components/ui/button";

  const navItems = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Use Cases", href: "#use-cases" },
  ];

  let scrollY = $state(0);
  const isFloating = $derived(scrollY > 50);

  function handleNavClick(event: MouseEvent, href: string) {
    event.preventDefault();
    const targetId = href.replace("#", "");
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      const headerOffset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }
</script>

<svelte:window bind:scrollY />

<div class="h-18">
  <header
    class="fixed top-0 right-0 left-0 z-50 transition-all duration-300 ease-out"
    class:floating={isFloating}
  >
    <div
      class="nav-inner mx-auto flex items-center justify-between border-border/50 bg-background/80 px-4 py-4 backdrop-blur-lg transition-all duration-300"
      class:floating={isFloating}
    >
      <Logo
        variant="ghost"
        class="mx-auto w-1/2 px-0 md:m-0 md:w-fit md:pl-0!"
        viewTransitionName="logo"
      />

      <!-- Centered nav items - hidden on mobile, visible on md+ -->
      <nav class="absolute left-1/2 hidden -translate-x-1/2 md:flex">
        <ul class="flex items-center gap-1">
          {#each navItems as item}
            <li>
              <a
                href={item.href}
                onclick={(e) => handleNavClick(e, item.href)}
                class="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {item.label}
              </a>
            </li>
          {/each}
        </ul>
      </nav>

      <div class="flex gap-2">
        <Button variant="outline" href="/auth?act=login" class="hidden sm:inline-flex"
          >Sign In</Button
        >
        <Button href="/auth?act=register" class="hidden sm:inline-flex">Get Started</Button>
      </div>
    </div>
  </header>
</div>

<style>
  header {
    padding: 0;
  }

  header.floating {
    padding: 0.75rem 1rem 0;
  }

  .nav-inner {
    border-bottom-width: 1px;
    border-radius: 0;
    box-shadow: none;
  }

  .nav-inner.floating {
    border-width: 1px;
    border-radius: 1rem;
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
    background: oklch(from var(--background) l c h / 0.95);
    box-shadow:
      0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1),
      0 0 0 1px rgb(0 0 0 / 0.05);
  }

  :global(.dark) .nav-inner.floating {
    box-shadow:
      0 4px 6px -1px rgb(0 0 0 / 0.3),
      0 2px 4px -2px rgb(0 0 0 / 0.2),
      0 0 0 1px rgb(255 255 255 / 0.05);
  }
</style>
