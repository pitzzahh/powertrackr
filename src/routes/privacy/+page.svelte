<script lang="ts">
  import { resolve } from "$app/paths";
</script>

<svelte:head>
  <title>Privacy Policy • PowerTrackr</title>
</svelte:head>

<section class="relative z-10 bg-background">
  <div class="container mx-auto px-4 py-16 lg:py-24">
    <div class="mx-auto max-w-3xl">
      <p class="text-xs tracking-[0.3em] text-muted-foreground uppercase">Privacy</p>
      <h1 class="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Privacy Policy</h1>
      <a
        href={resolve("/")}
        class="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
      >
        Back to Home
      </a>
      <p class="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
        This Privacy Policy explains how PowerTrackr collects, uses, and protects your information
        when you use our electricity billing and usage tracking tools.
      </p>

      <div class="mt-10 space-y-10 text-sm leading-relaxed text-muted-foreground md:text-base">
        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-foreground">Information we collect</h2>
          <ul class="list-disc space-y-2 pl-5">
            <li>
              <span class="font-medium text-foreground">Account data</span> such as name, email, authentication
              status, and security settings (including 2FA status).
            </li>
            <li>
              <span class="font-medium text-foreground">Billing and usage data</span> including billing
              cycles, meter readings, sub-meter allocations, charges, and balances.
            </li>
            <li>
              <span class="font-medium text-foreground">Payment records</span> that you enter or associate
              with billing entries.
            </li>
            <li>
              <span class="font-medium text-foreground">Operational data</span> like device info, log
              data, and usage events to keep the service reliable and secure.
            </li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-foreground">How we use information</h2>
          <ul class="list-disc space-y-2 pl-5">
            <li>Provide the core service: billing, usage tracking, and payment reconciliation.</li>
            <li>Secure your account, including authentication and security checks.</li>
            <li>Improve performance, reliability, and usability of the platform.</li>
            <li>Generate summaries, exports, and reports you request.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-foreground">Sharing and disclosure</h2>
          <p>
            We do not sell your data. We share information only when needed to operate the service
            (for example with infrastructure or support providers), or when required by law. Any
            sharing is limited to what is necessary.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-foreground">Data retention</h2>
          <p>
            We retain data as long as your account is active or as needed to provide the service.
            You can export your data at any time, and request deletion through the in-app support
            channels.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-foreground">Security</h2>
          <p>
            We use administrative, technical, and physical safeguards to protect your data. You can
            enhance account security by enabling two-factor authentication.
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-foreground">Your choices</h2>
          <ul class="list-disc space-y-2 pl-5">
            <li>Update your account settings and security preferences.</li>
            <li>Export billing and usage records for your own storage.</li>
            <li>Request deletion or correction of your data via support.</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-foreground">Changes to this policy</h2>
          <p>
            We may update this Privacy Policy as our service evolves. We will post updates on this
            page.
          </p>
        </section>
      </div>
    </div>
  </div>
</section>
