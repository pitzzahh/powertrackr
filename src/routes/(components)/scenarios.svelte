<script lang="ts">
  import { Users, Banknote, ChartLine, type PhosphorIcon } from "$lib/assets/icons";
  import { SplitReveal, ScrollStagger } from "$lib/motion-core";
  import SectionLabel from "./section-label.svelte";

  const scenarios = [
    {
      Icon: Users,
      title: "Multi-Tenant Buildings",
      description:
        "Manage per-unit sub-meter readings and allocate payments derived from a single utility account.",
      meta: "Shared utility accounts",
    },
    {
      Icon: Banknote,
      title: "Homeowners with Rentals",
      description:
        "Track the rental unit's consumption, expenses, and payments when sub-metered on your main account.",
      meta: "Clear tenant allocations",
    },
    {
      Icon: ChartLine,
      title: "Property Managers",
      description:
        "Concise per-period accounting for multiple units without complex energy-generation features.",
      meta: "Portfolio-level tracking",
    },
  ];
</script>

<section id="use-cases" class="relative z-10 border-t border-border/60 py-20 lg:py-28">
  <div class="container mx-auto px-4">
    <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div class="max-w-2xl">
        <SectionLabel index="03" label="Use Cases" note="who PowerTrackr is built for" />
        <SplitReveal mode="words" triggerOnScroll>
          <h2 class="mt-6 text-3xl font-semibold tracking-tight md:text-5xl">
            Built for the people who handle the bills
          </h2>
        </SplitReveal>
      </div>
      <SplitReveal mode="lines" triggerOnScroll delay={0.2}>
        <p class="max-w-md text-base text-muted-foreground">
          Practical billing and expense allocation for the scenarios you handle every day.
        </p>
      </SplitReveal>
    </div>

    <ScrollStagger
      preset="slide-up"
      stagger={0.12}
      duration={0.6}
      distance={36}
      class="mt-12 grid gap-4 md:grid-cols-3"
    >
      {#each scenarios as scenario (scenario.title)}
        <article
          class="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
        >
          <div class="flex items-center justify-between gap-3">
            <div
              class="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-colors group-hover:bg-primary/20"
            >
              <scenario.Icon class="size-5" />
            </div>
            <span
              class="rounded-full border border-border/60 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase"
            >
              {scenario.meta}
            </span>
          </div>
          <h3 class="mt-5 text-lg font-semibold">{scenario.title}</h3>
          <p class="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
            {scenario.description}
          </p>
        </article>
      {/each}
    </ScrollStagger>
  </div>
</section>
