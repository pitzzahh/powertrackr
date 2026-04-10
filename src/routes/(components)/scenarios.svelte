<script lang="ts">
  import { Card, CardDescription, CardHeader, CardTitle } from "$/components/ui/card";
  import { Users, Banknote, ChartLine, type PhosphorIcon } from "$lib/assets/icons";
  import { SplitReveal, ScrollStagger, Magnetic } from "$lib/motion-core";

  const scenarios = [
    {
      number: "01",
      Icon: Users,
      title: "Multi-Tenant Buildings",
      description:
        "Manage per-unit sub-meter readings and allocate payments derived from a single utility account.",
      meta: "Shared utility accounts",
    },
    {
      number: "02",
      Icon: Banknote,
      title: "Homeowners with Rentals",
      description:
        "Track the rental unit's consumption, expenses, and payments when sub-metered on your main account.",
      meta: "Clear tenant allocations",
    },
    {
      number: "03",
      Icon: ChartLine,
      title: "Property Managers",
      description:
        "Concise per-period accounting for multiple units without complex energy-generation features.",
      meta: "Portfolio-level tracking",
    },
  ];
</script>

<section id="use-cases" class="relative z-10 py-20 lg:py-28">
  <div class="container mx-auto px-4">
    <div class="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div>
        <SplitReveal mode="words" triggerOnScroll>
          <h2 class="text-3xl font-semibold tracking-tight md:text-5xl">Built For You</h2>
        </SplitReveal>
        <SplitReveal mode="lines" triggerOnScroll delay={0.2}>
          <p class="mt-4 max-w-md text-lg text-muted-foreground">
            Practical billing and expense allocation for the scenarios you handle every day.
          </p>
        </SplitReveal>
        <div class="mt-8 space-y-3 text-sm text-muted-foreground">
          <div class="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p class="font-medium text-foreground">Flexible for shared accounts</p>
            <p class="mt-2">Work cleanly across landlords, tenants, and property managers.</p>
          </div>
          <div class="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p class="font-medium text-foreground">Built for repeatable cycles</p>
            <p class="mt-2">Structure your billing in a way that is easy to review each period.</p>
          </div>
        </div>
      </div>

      <ScrollStagger
        preset="slide-up"
        stagger={0.12}
        duration={0.6}
        distance={36}
        class="grid items-stretch gap-4 sm:grid-cols-2"
      >
        {#each scenarios as scenario (scenario.title)}
          {@render scenarioCard(scenario)}
        {/each}
      </ScrollStagger>
    </div>
  </div>
</section>

{#snippet scenarioCard(scenario: {
  number: string;
  title: string;
  description: string;
  meta: string;
  Icon: PhosphorIcon;
})}
  <Magnetic class="h-full">
    <Card
      class="group relative h-full overflow-hidden border-border/60 bg-background/60 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
    >
      <CardHeader class="flex flex-row items-start gap-4">
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 transition-colors group-hover:bg-primary/20"
        >
          {scenario.number}
        </div>
        <div class="space-y-2">
          <CardTitle class="text-base">{scenario.title}</CardTitle>
          <CardDescription class="text-sm">
            {scenario.description}
          </CardDescription>
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <scenario.Icon class="h-4 w-4 text-primary" />
            <span>{scenario.meta}</span>
          </div>
        </div>
      </CardHeader>
    </Card>
  </Magnetic>
{/snippet}
