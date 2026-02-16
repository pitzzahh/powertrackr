<script lang="ts">
  import { goto } from "$app/navigation";
  import Logo from "$/components/logo.svelte";
  import { Button } from "$/components/ui/button";
  import { Card, CardDescription, CardHeader, CardTitle } from "$/components/ui/card";
  import { Zap, PhilippinePeso, Banknote } from "$lib/assets/icons";
</script>

<div class="flex min-h-screen flex-col bg-linear-to-br from-background to-muted">
  <!-- Header -->
  <header class="container mx-auto flex items-center justify-between px-4 py-6">
    <Logo
      variant="ghost"
      class="mx-auto w-1/2 px-0 md:m-0 md:w-fit md:pl-0!"
      viewTransitionName="logo"
    />

    <div class="flex gap-2">
      <Button variant="outline" onclick={() => goto("/auth?act=login")}>Login</Button>
      <Button onclick={() => goto("/auth?act=register")}>Sign Up</Button>
    </div>
  </header>

  <!-- Hero Section -->
  <main
    class="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-12 text-center"
  >
    <div class="max-w-4xl space-y-8">
      <div class="space-y-4">
        <h1 class="text-4xl font-bold tracking-tight md:text-6xl">
          Manage <span class="text-primary">Electricity</span> Billing
        </h1>
        <p class="mx-auto max-w-2xl text-xl text-muted-foreground">
          Record, organize, and reconcile electricity usage and payments across your account and
          sub-meters. Perfect for landlords, property managers, and multi-unit properties.
        </p>
      </div>

      <div class="flex flex-col justify-center gap-4 sm:flex-row">
        <Button size="lg" onclick={() => goto("/auth?act=register")}>Get Started Free</Button>
        <Button size="lg" variant="outline" onclick={() => goto("/auth?act=login")}>Sign In</Button>
      </div>

      <!-- Features -->
      <div class="mt-16 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Zap class="mx-auto mb-2 h-8 w-8 text-primary" />
            <CardTitle>Billing Records</CardTitle>
            <CardDescription>
              Record periodic billing entries with total kWh and balances per billing cycle.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <PhilippinePeso class="mx-auto mb-2 h-8 w-8 text-primary" />
            <CardTitle>Sub-Meter Tracking</CardTitle>
            <CardDescription>
              Support multiple sub-meters per billing period to track each unit's usage separately.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Banknote class="mx-auto mb-2 h-8 w-8 text-primary" />
            <CardTitle>Payment Reconciliation</CardTitle>
            <CardDescription>
              Associate payments with billing and sub-meter records for clear reconciliation.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="container mx-auto px-4 py-6 text-center text-muted-foreground">
    <p>&copy; {new Date().getFullYear()} PowerTrackr. All rights reserved.</p>
  </footer>
</div>
