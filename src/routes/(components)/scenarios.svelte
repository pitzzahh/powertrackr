<script lang="ts">
  import { Card, CardDescription, CardHeader, CardTitle } from "$/components/ui/card";
  import { Users, Banknote, ChartLine } from "$lib/assets/icons";
  import { SplitReveal, ScrollStagger, Magnetic } from "$lib/motion-core";
</script>

<section class="relative z-10 py-24">
  <div class="container mx-auto px-4">
    <div class="mb-16 text-center">
      <SplitReveal mode="words" triggerOnScroll>
        <h2 class="text-3xl font-bold tracking-tight md:text-5xl">Built For You</h2>
      </SplitReveal>
      <SplitReveal mode="lines" triggerOnScroll delay={0.2}>
        <p class="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Practical billing and expense allocation for common scenarios
        </p>
      </SplitReveal>
    </div>

    <ScrollStagger
      preset="slide-up"
      stagger={0.12}
      duration={0.6}
      distance={40}
      class="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3"
    >
      <Magnetic>
        <Card
          class="group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
        >
          <CardHeader>
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20"
            >
              <Users class="h-6 w-6 text-primary" />
            </div>
            <CardTitle class="text-lg">Multi-Tenant Buildings</CardTitle>
            <CardDescription>
              Manage per-unit sub-meter readings and allocate payments derived from a single utility
              account.
            </CardDescription>
          </CardHeader>
        </Card>
      </Magnetic>

      <Magnetic>
        <Card
          class="group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
        >
          <CardHeader>
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20"
            >
              <Banknote class="h-6 w-6 text-primary" />
            </div>
            <CardTitle class="text-lg">Homeowners with Rentals</CardTitle>
            <CardDescription>
              Track the rental unit's consumption, expenses, and payments when sub-metered on your
              main account.
            </CardDescription>
          </CardHeader>
        </Card>
      </Magnetic>

      <Magnetic>
        <Card
          class="group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
        >
          <CardHeader>
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20"
            >
              <ChartLine class="h-6 w-6 text-primary" />
            </div>
            <CardTitle class="text-lg">Property Managers</CardTitle>
            <CardDescription>
              Concise per-period accounting for multiple units without complex energy-generation
              features.
            </CardDescription>
          </CardHeader>
        </Card>
      </Magnetic>
    </ScrollStagger>
  </div>
</section>
