<script lang="ts">
  import Logo from "$/components/logo.svelte";
  import { Button } from "$/components/ui/button";

  const navItems = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Use Cases", href: "#use-cases" },
  ];

  function handleNavClick(event: MouseEvent, href: string) {
    event.preventDefault();
    const targetId = href.replace("#", "");
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      const headerOffset = 80; // Account for sticky header height
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }
</script>

<header
  class="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg supports-backdrop-filter:bg-background/60"
>
  <div class="container mx-auto flex items-center justify-between px-4 py-4">
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
      <Button variant="outline" href="/auth?act=login" class="hidden sm:inline-flex">Login</Button>
      <Button href="/auth?act=register" class="hidden sm:inline-flex">Get Started</Button>
    </div>
  </div>
</header>
