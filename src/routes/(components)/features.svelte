<script lang="ts">
  import { Card, CardDescription, CardHeader, CardTitle } from "$/components/ui/card";
  import { ChartLine, Users, Shield, Download } from "$lib/assets/icons";
  import { SplitReveal, ScrollStagger, Magnetic } from "$lib/motion-core";
</script>

<section id="features" class="relative z-10 py-32">
  <div class="container mx-auto px-4">
    <div class="mb-16 text-center">
      <SplitReveal mode="words" triggerOnScroll>
        <h2 class="text-3xl font-bold tracking-tight md:text-5xl">Why Choose PowerTrackr?</h2>
      </SplitReveal>
      <SplitReveal mode="lines" triggerOnScroll delay={0.2}>
        <p class="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Software-focused tracking and billing for practical expense allocation
        </p>
      </SplitReveal>
    </div>

    <ScrollStagger
      preset="slide-up"
      stagger={0.1}
      duration={0.6}
      distance={40}
      class="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4"
    >
      <Magnetic class="h-full">
        <Card
          class="group relative h-full overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
        >
          <CardHeader>
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20"
            >
              <ChartLine class="h-6 w-6 text-primary" />
            </div>
            <CardTitle class="text-lg">Billing Summaries</CardTitle>
            <CardDescription>
              Straightforward billing summaries and per-unit charge calculations for tenant billing.
            </CardDescription>
          </CardHeader>
        </Card>
      </Magnetic>

      <Magnetic class="h-full">
        <Card
          class="group relative h-full overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
        >
          <CardHeader>
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20"
            >
              <Users class="h-6 w-6 text-primary" />
            </div>
            <CardTitle class="text-lg">User Accounts</CardTitle>
            <CardDescription>
              User account flows including verification and optional two-factor authentication.
            </CardDescription>
          </CardHeader>
        </Card>
      </Magnetic>

      <Magnetic class="h-full">
        <Card
          class="group relative h-full overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
        >
          <CardHeader>
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20"
            >
              <Shield class="h-6 w-6 text-primary" />
            </div>
            <CardTitle class="text-lg">Input Validation</CardTitle>
            <CardDescription>
              Input validation and tests to help ensure consistency and correctness in your records.
            </CardDescription>
          </CardHeader>
        </Card>
      </Magnetic>

      <Magnetic class="h-full">
        <Card
          class="group relative h-full overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
        >
          <CardHeader>
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20"
            >
              <Download class="h-6 w-6 text-primary" />
            </div>
            <CardTitle class="text-lg">Import & Export</CardTitle>
            <CardDescription>
              Export your data for local backups and easily re-import when needed. Your data, your
              control.
            </CardDescription>
          </CardHeader>
        </Card>
      </Magnetic>
    </ScrollStagger>
  </div>
</section>
