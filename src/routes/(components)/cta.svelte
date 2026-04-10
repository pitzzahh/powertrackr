<script module lang="ts">
  interface CtaProps {
    user?: App.Locals["user"];
  }
</script>

<script lang="ts">
  import { Button } from "$/components/ui/button";
  import { SplitReveal, ScrollReveal } from "$lib/motion-core";

  let { user }: CtaProps = $props();
</script>

<section class="relative z-10 py-24 lg:py-32">
  <div class="container mx-auto px-4">
    <ScrollReveal preset="scale" duration={0.8} scale={0.96}>
      <div
        class="relative overflow-hidden rounded-3xl border border-border/60 bg-background/60 p-8 backdrop-blur sm:p-12 lg:p-14"
      >
        <div class="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div class="relative">
            <SplitReveal mode="words" triggerOnScroll>
              <h2 class="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
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
              <div class="mt-10 flex flex-col gap-4 sm:flex-row">
                {#if user}
                  <Button
                    size="lg"
                    class="shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
                    href="/dashboard"
                  >
                    Go to Dashboard
                  </Button>
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
            <div
              class="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl"
            ></div>
            <div class="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <div
                class="flex items-center justify-between text-xs tracking-[0.3em] text-muted-foreground uppercase"
              >
                <span>Command board</span>
                <span class="rounded-full border border-border/60 px-2 py-1 text-[10px]">Live</span>
              </div>
              <div class="mt-6 space-y-3">
                <div
                  class="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm"
                >
                  <span>New billing cycle</span>
                  <kbd class="rounded bg-muted px-2 py-1 text-xs">B</kbd>
                </div>
                <div
                  class="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm"
                >
                  <span>Record payment</span>
                  <kbd class="rounded bg-muted px-2 py-1 text-xs">P</kbd>
                </div>
                <div
                  class="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm"
                >
                  <span>Export summary</span>
                  <kbd class="rounded bg-muted px-2 py-1 text-xs">E</kbd>
                </div>
              </div>
              <p class="mt-6 text-xs text-muted-foreground">
                Automate routine billing work with quick, repeatable steps.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ScrollReveal>
  </div>
</section>
