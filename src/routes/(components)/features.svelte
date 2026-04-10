<script lang="ts">
  import { Card, CardDescription, CardHeader, CardTitle } from "$/components/ui/card";
  import { ChartLine, Users, Shield, Download, type PhosphorIcon } from "$lib/assets/icons";
  import { SplitReveal, ScrollStagger, Magnetic } from "$lib/motion-core";

  const features = [
    {
      Icon: ChartLine,
      title: "Billing Summaries",
      description:
        "Straightforward billing summaries and per-unit charge calculations for tenant billing.",
    },
    {
      Icon: Users,
      title: "User Accounts",
      description:
        "Verification flows and optional two-factor authentication to protect data access.",
    },
    {
      Icon: Shield,
      title: "Input Validation",
      description: "Built-in safeguards to keep each entry consistent and ready for review.",
    },
    {
      Icon: Download,
      title: "Import & Export",
      description: "Export your data for local backups and easily re-import when needed.",
    },
  ];
</script>

<section id="features" class="relative z-10 py-20 lg:py-28">
  <div class="container mx-auto px-4">
    <div class="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div>
        <SplitReveal mode="words" triggerOnScroll>
          <h2 class="text-3xl font-semibold tracking-tight md:text-5xl">Why Choose PowerTrackr?</h2>
        </SplitReveal>
        <SplitReveal mode="lines" triggerOnScroll delay={0.2}>
          <p class="mt-4 max-w-md text-lg text-muted-foreground">
            Software-focused tracking and billing built around clear, repeatable workflows.
          </p>
        </SplitReveal>

        <div class="mt-8 space-y-4 text-sm text-muted-foreground">
          <div class="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p class="font-medium text-foreground">Designed for property managers</p>
            <p class="mt-2">
              Keep per-unit billing consistent while staying audit-ready across every cycle.
            </p>
          </div>
          <div class="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <p class="font-medium text-foreground">Built for fast reconciliation</p>
            <p class="mt-2">Tie usage to payments without spreadsheets or manual matching.</p>
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
        {#each features as feature (feature.title)}
          {@render featureCard(feature)}
        {/each}
      </ScrollStagger>
    </div>
  </div>
</section>

{#snippet featureCard(feature: { Icon: PhosphorIcon; title: string; description: string })}
  <Magnetic class="h-full">
    <Card
      class="group relative h-full overflow-hidden border-border/60 bg-background/60 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
    >
      <CardHeader class="flex flex-row items-start gap-4">
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 transition-colors group-hover:bg-primary/20"
        >
          <feature.Icon class="h-5 w-5 text-primary" />
        </div>
        <div class="space-y-1">
          <CardTitle class="text-base">{feature.title}</CardTitle>
          <CardDescription class="text-sm">
            {feature.description}
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  </Magnetic>
{/snippet}
