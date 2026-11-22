<script lang="ts">
  import ExampleBill from "./example-bill.svelte";
  import HeroCta from "./hero-cta.svelte";
</script>

<section class="container mx-auto px-4 pt-14 pb-20 lg:pt-24 lg:pb-28">
  <div class="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
    <div>
      <h1 class="text-4xl font-semibold tracking-tight text-balance md:text-5xl lg:text-6xl">
        Split the electric bill by what each unit
        <mark class="box-decoration-clone bg-highlight px-1 text-highlight-foreground"
          >actually used</mark
        >.
      </h1>

      <p class="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
        Enter the utility bill and each sub-meter reading. PowerTrackr works out the rate per kWh,
        tells every tenant what they owe, and keeps the record for when someone asks.
      </p>

      <HeroCta />

      <p class="mt-5 text-sm text-muted-foreground">
        Free to use. Tenants get their own login to submit readings.
      </p>
    </div>

    <ExampleBill class="self-start" />
  </div>
</section>
