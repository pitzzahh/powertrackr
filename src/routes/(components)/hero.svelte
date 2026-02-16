<script lang="ts">
  import { Button } from "$/components/ui/button";
  import { Card, CardDescription, CardHeader, CardTitle } from "$/components/ui/card";
  import { Zap, PhilippinePeso, Banknote } from "$lib/assets/icons";
  import { TextLoop, Magnetic } from "$lib/motion-core";
</script>

<section
  class="relative z-10 flex min-h-[calc(100vh-73px)] flex-col items-center justify-center px-4 py-20 text-center"
>
  <div class="container mx-auto w-full max-w-4xl">
    <!-- Badge -->
    <div
      class="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
    >
      <Zap class="h-4 w-4" />
      <span>Electricity Billing Made Simple</span>
    </div>

    <!-- Hero Title -->
    <div class="flex min-h-25 flex-col items-center justify-center md:min-h-55 lg:min-h-52">
      <h1 class="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
        Track{" "}
        <span class="inline-flex justify-center align-baseline">
          <TextLoop
            class="text-primary"
            texts={["Billing", "Payments", "Usage", "Expenses"]}
            interval={2500}
          />
        </span>{" "}
        Easily
      </h1>
      <p class="mt-2 text-3xl font-normal text-muted-foreground md:text-4xl lg:text-5xl">
        for multi-tenant properties
      </p>
    </div>

    <p class="mx-auto my-6 mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
      Record, organize, and reconcile electricity usage and payments across your account and
      sub-meters. Built for landlords, property managers, and multi-unit properties who need
      practical billing and expense allocation.
    </p>

    <div class="flex flex-col justify-center gap-4 sm:flex-row">
      <Magnetic>
        <Button
          size="lg"
          class="shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
          href="/auth?act=register"
        >
          Get Started Free
        </Button>
      </Magnetic>
      <Magnetic>
        <Button size="lg" variant="outline" href="/auth?act=login">Sign In</Button>
      </Magnetic>
    </div>

    <!-- Features Grid -->
    <div class="mt-16 grid gap-6 md:grid-cols-3">
      <Card
        class="group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
      >
        <div
          class="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        ></div>
        <CardHeader class="relative">
          <div
            class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20"
          >
            <Zap class="h-7 w-7 text-primary" />
          </div>
          <CardTitle class="text-lg">Billing Records</CardTitle>
          <CardDescription>
            Record periodic billing entries with total kWh and balances per billing cycle.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card
        class="group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
      >
        <div
          class="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        ></div>
        <CardHeader class="relative">
          <div
            class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20"
          >
            <PhilippinePeso class="h-7 w-7 text-primary" />
          </div>
          <CardTitle class="text-lg">Sub-Meter Tracking</CardTitle>
          <CardDescription>
            Support multiple sub-meters per billing period to track each unit's usage separately.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card
        class="group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
      >
        <div
          class="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        ></div>
        <CardHeader class="relative">
          <div
            class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20"
          >
            <Banknote class="h-7 w-7 text-primary" />
          </div>
          <CardTitle class="text-lg">Payment Reconciliation</CardTitle>
          <CardDescription>
            Associate payments with billing and sub-meter records for clear reconciliation.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  </div>
</section>
