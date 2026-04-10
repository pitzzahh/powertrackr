<script lang="ts">
  import { resolve } from "$app/paths";
</script>

<svelte:head>
  <title>Terms & Conditions • PowerTrackr</title>
</svelte:head>

<section class="relative z-10 bg-background">
  <div class="container mx-auto px-4 py-16 lg:py-24">
    <div class="mx-auto max-w-3xl">
      <p class="text-xs tracking-[0.3em] text-muted-foreground uppercase">Terms</p>
      <h1 class="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Terms & Conditions</h1>
      <a
        href={resolve("/")}
        class="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
      >
        Back to Home
      </a>
      <p class="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
        These Terms & Conditions govern your use of PowerTrackr, a platform for electricity billing,
        usage tracking, and payment reconciliation. By using the service, you agree to these terms.
      </p>

      <div class="mt-10 space-y-10 text-sm leading-relaxed text-muted-foreground md:text-base">
        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-foreground">Use of the service</h2>
          <p>
            PowerTrackr provides tools to record billing cycles, meter readings, sub-meter
            allocations, and payments. You are responsible for the accuracy of data you input and
            for maintaining your own records.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-foreground">Accounts and security</h2>
          <ul class="list-disc space-y-2 pl-5">
            <li>Keep your login credentials secure.</li>
            <li>Enable two-factor authentication if available for your account.</li>
            <li>Notify support if you believe your account has been compromised.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-foreground">Billing data and payments</h2>
          <p>
            PowerTrackr helps you track billing and payments, but it does not guarantee the
            correctness of calculations you supply. Verify charges, usage, and payment allocations
            before sharing with tenants or stakeholders.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-foreground">Exports and backups</h2>
          <p>
            You can export your data for backup or reporting. You are responsible for storing and
            securing exported files.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-foreground">Acceptable use</h2>
          <ul class="list-disc space-y-2 pl-5">
            <li>Do not attempt to access or disrupt other users’ data.</li>
            <li>Do not misuse the service for unlawful or unauthorized purposes.</li>
            <li>Do not reverse engineer or abuse system access.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-foreground">Availability</h2>
          <p>
            We strive to keep PowerTrackr reliable and available, but service interruptions may
            occur. We may perform maintenance or updates that temporarily affect availability.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-foreground">Termination</h2>
          <p>
            You may stop using the service at any time. We may suspend or terminate access if
            accounts violate these terms or create security risks.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-foreground">Limitation of liability</h2>
          <p>
            PowerTrackr is provided “as is.” We are not liable for indirect or consequential damages
            arising from your use of the service, including errors in data you provide or decisions
            you make based on it.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-foreground">Changes to these terms</h2>
          <p>We may update these Terms & Conditions as the service evolves.</p>
        </section>
      </div>
    </div>
  </div>
</section>
