<script lang="ts">
  import Logo from "$/components/logo.svelte";
</script>

<footer class="relative z-10 border-t border-border/50 bg-muted/30 py-12">
  <div class="container mx-auto px-4">
    <div class="flex flex-col items-center justify-between gap-4 md:flex-row">
      <Logo variant="ghost" class="px-0 md:pl-0!" viewTransitionName="logo-footer" />
      <p class="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} PowerTrackr. All rights reserved.
      </p>
    </div>
  </div>
</footer>
