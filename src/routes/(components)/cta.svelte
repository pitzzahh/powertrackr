<script lang="ts">
  import { Button } from "$/components/ui/button";
  import { Banknote, Download, InvoiceIcon } from "$lib/assets/icons";
  import { SplitReveal, ScrollReveal } from "$lib/motion-core";
  import SectionLabel from "./section-label.svelte";
  import { getCurrentUser } from "$/api/user.remote";
  import { ButtonSkeleton } from "$/components/snippets.svelte";
  import { browser } from "$app/environment";

  const authQuery = browser ? getCurrentUser() : null;
  const user = $derived(authQuery?.current?.user ?? null);
</script>

<section class="relative z-10 py-16 sm:py-24 lg:py-32">
  <div class="container mx-auto px-4">
    <ScrollReveal preset="scale" duration={0.8} scale={0.96}>
      <div
        class="relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur sm:p-12 lg:p-14"
      >
        <div
          class="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        ></div>
        <div class="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
          <div class="relative">
            <SectionLabel index="04" label="Get Started" note="takes about a minute" />
            <SplitReveal mode="words" triggerOnScroll>
              <h2 class="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                Ready to simplify your billing?
              </h2>
            </SplitReveal>

            <SplitReveal mode="lines" triggerOnScroll delay={0.2} class="mt-6">
              <p class="max-w-xl text-base leading-snug text-muted-foreground sm:text-lg">
                Join property managers and landlords who trust PowerTrackr for their electricity
                billing and payment tracking needs.
              </p>
            </SplitReveal>

            <ScrollReveal preset="slide-up" duration={0.6} delay={0.4} distance={30}>
              <div class="mt-8 flex flex-col gap-4 sm:flex-row">
                {#if user}
                  <Button
                    data-sveltekit-reload
                    size="lg"
                    class="shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
                    href="/dashboard"
                  >
                    Go to Dashboard
                  </Button>
                {:else if authQuery?.loading}
                  {@render ButtonSkeleton({ size: "lg" })}
                {:else}
                  <Button
                    size="lg"
                    class="shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
                    href="/auth?act=register"
                  >
                    Get Started Free
                  </Button>
                  <Button size="lg" variant="outline" href="/auth?act=login">Sign In</Button>
                {/if}
              </div>
            </ScrollReveal>
          </div>

          <div class="relative">
            <div class="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <div
                class="flex items-center justify-between font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase"
              >
                <span>Quick Actions</span>
              </div>
              <div class="mt-6 space-y-3">
                <div
                  class="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm"
                >
                  <span>New billing cycle</span>
                  <InvoiceIcon class="size-4 text-muted-foreground" />
                </div>
                <div
                  class="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm"
                >
                  <span>Record payment</span>
                  <Banknote class="size-4 text-muted-foreground" />
                </div>
                <div
                  class="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm"
                >
                  <span>Export summary</span>
                  <Download class="size-4 text-muted-foreground" />
                </div>
              </div>
              <p class="mt-6 text-xs text-muted-foreground">
                Start a billing cycle, log a payment, or export your data — all from the dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ScrollReveal>
  </div>
</section>
