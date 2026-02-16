<script lang="ts">
  import Logo from "$/components/logo.svelte";
  import { Button } from "$/components/ui/button";
  import { Magnetic } from "$lib/motion-core";
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

    <div class="flex gap-2">
      <Magnetic>
        <Button variant="outline" href="/auth?act=login">Login</Button>
      </Magnetic>
      <Magnetic>
        <Button href="/auth?act=register">Sign Up</Button>
      </Magnetic>
    </div>
  </div>
</header>
