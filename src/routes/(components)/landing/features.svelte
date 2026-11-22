<script lang="ts" module>
  const FEATURES = [
    {
      title: "Tenant logins",
      body: "Each unit gets an account to submit its reading and see its own bills. Nobody sees anyone else's.",
    },
    {
      title: "Payment tracking",
      body: "Every share is tied to the bill it came from, so you can see at a glance who has paid and who hasn't.",
    },
    {
      title: "History and usage",
      body: "Past bills and monthly consumption per meter, so a jump in usage is easy to spot and explain.",
    },
    {
      title: "Checks on input",
      body: "A reading lower than last month's, or sub-meters that add up to more than the bill, gets rejected.",
    },
    {
      title: "Import and export",
      body: "Download everything as JSON for your own backup, and bring it back in when you need to.",
    },
    {
      title: "Two-factor sign-in",
      body: "Optional authenticator-app codes on top of email verification or GitHub sign-in.",
    },
  ];
</script>

<section id="features">
  <div class="container mx-auto grid gap-10 px-4 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
    <h2 class="text-3xl font-semibold tracking-tight md:text-4xl">What's included</h2>

    <dl class="grid gap-x-8 gap-y-8 sm:grid-cols-2">
      {#each FEATURES as feature (feature.title)}
        <div class="border-t-2 border-foreground pt-4">
          <dt class="font-semibold">{feature.title}</dt>
          <dd class="mt-1.5 leading-relaxed text-muted-foreground">{feature.body}</dd>
        </div>
      {/each}
    </dl>
  </div>
</section>
