<script lang="ts" module>
  const STEPS = [
    {
      title: "Enter the bill",
      body: "Type in the total kWh and amount from your utility bill. The rate per kWh is calculated for you.",
    },
    {
      title: "Collect readings",
      body: "Read each sub-meter yourself, or open the period and let tenants submit their own. The bill stays pending until every reading is in.",
    },
    {
      title: "Record payments",
      body: "Each unit's share is set from its usage, and the main meter covers the rest. Mark payments as they come in and see who still owes.",
    },
  ];
</script>

<section id="how-it-works" class="border-y bg-muted">
  <div class="container mx-auto grid gap-10 px-4 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
    <h2 class="text-3xl font-semibold tracking-tight md:text-4xl">How it works</h2>

    <ol class="grid gap-10 md:grid-cols-3 md:gap-8">
      {#each STEPS as step, i (step.title)}
        <li>
          <span
            class="grid size-10 place-items-center rounded-sm bg-highlight text-lg font-semibold text-highlight-foreground tabular-nums"
          >
            {i + 1}
          </span>
          <h3 class="mt-3 text-lg font-semibold">{step.title}</h3>
          <p class="mt-2 leading-relaxed text-muted-foreground">{step.body}</p>
        </li>
      {/each}
    </ol>
  </div>
</section>
