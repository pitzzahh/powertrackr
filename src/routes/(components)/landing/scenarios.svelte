<script lang="ts" module>
  const AUDIENCES = [
    {
      title: "Apartment and boarding-house owners",
      body: "One utility account, several units, each with its own sub-meter.",
    },
    {
      title: "Homeowners renting out a unit",
      body: "The rental runs off your main meter and you want the split to be fair and on record.",
    },
    {
      title: "Property managers",
      body: "Several buildings, a bill a month each, and owners who want the numbers.",
    },
  ];
</script>

<section id="use-cases" class="border-t">
  <div class="container mx-auto grid gap-10 px-4 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
    <h2 class="text-3xl font-semibold tracking-tight md:text-4xl">Who it's for</h2>

    <ul class="divide-y border-y">
      {#each AUDIENCES as audience (audience.title)}
        <li class="grid gap-1 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:gap-8">
          <h3 class="font-semibold">{audience.title}</h3>
          <p class="text-muted-foreground">{audience.body}</p>
        </li>
      {/each}
    </ul>
  </div>
</section>
