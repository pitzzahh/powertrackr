<script lang="ts">
  import { SplitReveal, ScrollStagger } from "$lib/motion-core";

  const steps = [
    {
      number: "01",
      title: "Record Billing Entries",
      description:
        "Enter your periodic billing entries with total kWh and balances per billing cycle.",
    },
    {
      number: "02",
      title: "Track Sub-Meters",
      description:
        "Add multiple sub-meters per billing period to track each unit's usage separately.",
    },
    {
      number: "03",
      title: "Reconcile Payments",
      description:
        "Associate payments with billing and sub-meter records for clear reconciliation.",
    },
  ];
</script>

<section class="relative z-10 py-24">
  <div class="container mx-auto px-4">
    <div class="mb-16 text-center">
      <SplitReveal mode="words" triggerOnScroll>
        <h2 class="text-3xl font-bold tracking-tight md:text-5xl">How It Works</h2>
      </SplitReveal>
      <SplitReveal mode="lines" triggerOnScroll delay={0.2}>
        <p class="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Get started in minutes with our simple three-step process
        </p>
      </SplitReveal>
    </div>

    <ScrollStagger
      preset="slide-up"
      stagger={0.15}
      duration={0.6}
      distance={40}
      class="mx-auto grid max-w-5xl gap-8 md:grid-cols-3"
    >
      {#each steps as step, i}
        <div class="group relative">
          <div
            class="relative rounded-2xl border border-border/50 bg-background/50 p-8 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
          >
            <div
              class="mb-4 text-6xl font-bold text-primary/20 transition-colors group-hover:text-primary/40"
            >
              {step.number}
            </div>
            <h3 class="mb-2 text-xl font-semibold">
              <SplitReveal mode="chars" triggerOnScroll delay={0.1 * i}>
                {step.title}
              </SplitReveal>
            </h3>
            <p class="text-muted-foreground">
              <SplitReveal mode="lines" triggerOnScroll delay={0.2 + 0.1 * i}>
                {step.description}
              </SplitReveal>
            </p>
          </div>
          {#if i < steps.length - 1}
            <div
              class="absolute top-1/2 -right-4 hidden h-0.5 w-8 bg-linear-to-r from-primary/50 to-transparent md:block"
            ></div>
          {/if}
        </div>
      {/each}
    </ScrollStagger>
  </div>
</section>
