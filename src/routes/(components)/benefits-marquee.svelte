<script lang="ts">
  import { CheckCircle } from "$lib/assets/icons";
  import { Marquee } from "$lib/motion-core";

  const benefits = [
    "Billing Records",
    "Payment Tracking",
    "Sub-Meter Support",
    "Payment History",
    "Usage Calculations",
    "Secure Accounts",
    "Easy Reconciliation",
    "Per-Unit Charges",
  ];
</script>

<section class="relative z-10 border-y border-border/50 bg-muted/30 py-8">
  <Marquee class="py-4" gap={48} duration={25} velocity={0.1}>
    {#each benefits as benefit}
      <div class="flex items-center gap-3 text-xl font-medium text-foreground/80">
        <CheckCircle class="h-5 w-5 text-primary" />
        <span>{benefit}</span>
      </div>
    {/each}
  </Marquee>
  <Marquee class="py-4" gap={48} duration={30} velocity={0.3} reversed>
    {#each benefits as benefit}
      <div class="flex items-center gap-3 text-xl font-medium text-foreground/80">
        <CheckCircle class="h-5 w-5 text-primary" />
        <span>{benefit}</span>
      </div>
    {/each}
  </Marquee>
</section>
