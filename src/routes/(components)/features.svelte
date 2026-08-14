<script lang="ts">
  import { ChartLine, Users, Shield, Download, type PhosphorIcon } from "#lib/assets/icons.js";
  import { SplitReveal } from "#lib/motion-core/index.js";
  import SectionLabel from "./section-label.svelte";

  const features = [
    {
      Icon: ChartLine,
      title: "Billing Summaries",
      description:
        "Straightforward billing summaries and per-unit charge calculations for tenant billing.",
      tag: "Per-unit charges",
    },
    {
      Icon: Users,
      title: "User Accounts",
      description:
        "Verification flows and optional two-factor authentication to protect data access.",
      tag: "2FA optional",
    },
    {
      Icon: Shield,
      title: "Input Validation",
      description: "Built-in safeguards to keep each entry consistent and ready for review.",
      tag: "Audit-ready",
    },
    {
      Icon: Download,
      title: "Import & Export",
      description: "Export your data for local backups and easily re-import when needed.",
      tag: "JSON backup",
    },
  ];
</script>

<section id="features" class="relative z-10 border-t border-border/60 py-20 lg:py-28">
  <div class="container mx-auto px-4">
    <div class="max-w-2xl">
      <SectionLabel index="02" label="Features" note="what PowerTrackr handles for you" />
      <SplitReveal mode="words" triggerOnScroll>
        <h2 class="mt-6 text-3xl font-semibold tracking-tight md:text-5xl">
          Everything a landlord needs to bill well
        </h2>
      </SplitReveal>
      <SplitReveal mode="lines" triggerOnScroll delay={0.2}>
        <p class="mt-4 max-w-xl text-lg text-muted-foreground">
          Software-focused tracking and billing built around clear, repeatable workflows.
        </p>
      </SplitReveal>
    </div>

    <div class="mt-12">
      {#each features as feature (feature.title)}
        <div
          class="group -mx-4 grid items-start gap-4 border-t border-border/60 px-4 py-7 transition-colors hover:bg-muted/20 sm:grid-cols-[auto_1fr_auto] sm:gap-8"
        >
          <div
            class="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-colors group-hover:bg-primary/20"
          >
            <feature.Icon class="size-5" />
          </div>
          <div>
            <h3 class="text-lg font-semibold">{feature.title}</h3>
            <p class="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              {feature.description}
            </p>
          </div>
          <span
            class="hidden rounded-full border border-border/60 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase sm:inline-block"
          >
            {feature.tag}
          </span>
        </div>
      {/each}
      <div class="border-t border-border/60"></div>
    </div>
  </div>
</section>
