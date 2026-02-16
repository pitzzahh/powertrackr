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
