<script lang="ts">
  import { SplitReveal, ScrollStagger, Magnetic } from "$lib/motion-core";

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

<section id="how-it-works" class="relative z-10 py-24 lg:py-32">
  <div class="container mx-auto px-4">
    <div class="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div class="lg:sticky lg:top-28">
        <SplitReveal mode="words" triggerOnScroll>
          <h2 class="text-3xl font-semibold tracking-tight md:text-5xl">How It Works</h2>
        </SplitReveal>
        <SplitReveal mode="lines" triggerOnScroll delay={0.2}>
          <p class="mt-4 max-w-md text-lg text-muted-foreground">
            A clear timeline that mirrors how you actually manage billing cycles.
          </p>
        </SplitReveal>
        <div class="mt-8 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span class="rounded-full border border-border/60 px-3 py-1">3 steps</span>
          <span class="rounded-full border border-border/60 px-3 py-1">No spreadsheets</span>
          <span class="rounded-full border border-border/60 px-3 py-1">Audit-ready</span>
        </div>
      </div>

      <ScrollStagger
        preset="slide-up"
        stagger={0.12}
        duration={0.6}
        distance={36}
        class="relative space-y-6"
      >
        <div
          class="pointer-events-none absolute top-10 bottom-10 left-5 hidden w-px bg-linear-to-b from-primary/50 via-primary/10 to-transparent md:block"
        ></div>

        {#each steps as step, i (step.number)}
          <article class="relative md:pl-14">
            <div
              class="absolute top-6 left-0 hidden h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-background text-xs font-semibold text-primary ring-8 ring-background before:absolute before:inset-1 before:rounded-full before:bg-primary/10 before:content-[''] md:flex"
            >
              {step.number}
            </div>
            <Magnetic>
              <div
                class="rounded-2xl border border-border/60 bg-background/60 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
              >
                <div class="flex items-start justify-between gap-4">
                  <h3 class="text-lg font-semibold">
                    <SplitReveal mode="chars" triggerOnScroll delay={0.1 * i}>
                      {step.title}
                    </SplitReveal>
                  </h3>
                  <span class="text-xs text-muted-foreground">Step {i + 1}</span>
                </div>
                <p class="mt-3 text-sm text-muted-foreground">
                  <SplitReveal mode="lines" triggerOnScroll delay={0.2 + 0.1 * i}>
                    {step.description}
                  </SplitReveal>
                </p>
              </div>
            </Magnetic>
          </article>
        {/each}
      </ScrollStagger>
    </div>
  </div>
</section>
