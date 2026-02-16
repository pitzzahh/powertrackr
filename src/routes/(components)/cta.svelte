<script lang="ts">
  import { Button } from "$/components/ui/button";
  import { SplitReveal, ScrollReveal } from "$lib/motion-core";
</script>

<section class="relative z-10 py-24">
  <div class="container mx-auto px-4">
    <ScrollReveal preset="scale" duration={0.8} scale={0.95}>
      <div
        class="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-primary/10 via-primary/5 to-transparent p-8 backdrop-blur-sm sm:p-12 md:p-16"
      >
        <div class="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/20 blur-3xl"></div>
        <div
          class="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
        ></div>

        <div class="relative flex flex-col items-center">
          <SplitReveal mode="words" triggerOnScroll>
            <h2
              class="max-w-2xl text-center text-3xl leading-tight font-bold tracking-tight sm:text-4xl md:text-5xl"
            >
              Ready to simplify your billing?
            </h2>
          </SplitReveal>

          <SplitReveal mode="lines" triggerOnScroll delay={0.2} class="mt-6">
            <p
              class="max-w-2xl text-center text-base leading-snug text-muted-foreground sm:text-lg"
            >
              Join property managers and landlords who trust PowerTrackr for their electricity
              billing and payment tracking needs.
            </p>
          </SplitReveal>

          <ScrollReveal preset="slide-up" duration={0.6} delay={0.4} distance={30}>
            <div class="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                class="shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
                href="/auth?act=register"
              >
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" href="/auth?act=login">Sign In</Button>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </ScrollReveal>
  </div>
</section>
