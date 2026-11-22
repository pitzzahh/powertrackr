<script lang="ts">
  import ExampleBill from "#routes/(components)/landing/example-bill.svelte";
</script>

<!-- `dark` scopes the dark tokens, so this panel is ink in both themes. -->
<div class="dark flex h-full flex-col justify-center bg-background p-10 text-foreground xl:p-16">
  <div class="mx-auto w-full max-w-xl">
    <h2 class="text-2xl font-semibold tracking-tight text-balance">
      One bill in, every unit's share out.
    </h2>
    <p class="mt-2 text-muted-foreground">
      The rate comes from your utility bill. Each share comes from that unit's sub-meter.
    </p>
    <ExampleBill class="mt-8" />
  </div>
</div>
