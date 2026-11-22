<script lang="ts" module>
  export type SecurityTabProps = {
    user: App.Locals["user"];
    busy?: boolean;
  };
</script>

<script lang="ts">
  import Disable2FAForm from "./disable-2fa-form.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Badge } from "#lib/components/ui/badge/index.js";
  import { Shield, ShieldCheck, ShieldOff } from "#lib/assets/icons.js";
  import { cn } from "#lib/utils/style.js";

  let { user, busy = $bindable(false) }: SecurityTabProps = $props();

  const enabled = $derived(!!user?.registeredTwoFactor);
</script>

<div class="space-y-4">
  <h4 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
    Two-Factor Authentication
  </h4>

  <div class="flex items-center justify-between rounded-lg border p-4">
    <div class="space-y-1">
      <div class="flex items-center gap-2">
        {#if enabled}
          <ShieldCheck class="size-5 text-success" />
          <span class="font-medium">2FA is enabled</span>
        {:else}
          <ShieldOff class="size-5 text-muted-foreground" />
          <span class="font-medium">2FA is not enabled</span>
        {/if}
      </div>
      <p class="text-sm text-muted-foreground">
        {enabled
          ? "Your account is protected with two-factor authentication."
          : "Add an extra layer of security to your account."}
      </p>
    </div>
    <Badge
      class={cn(enabled ? "bg-success/12 text-success-strong" : "bg-muted text-muted-foreground")}
    >
      {enabled ? "Enabled" : "Disabled"}
    </Badge>
  </div>

  {#if !enabled}
    <div class="rounded-lg border border-dashed p-6 text-center">
      <Shield class="mx-auto size-12 text-muted-foreground/50" />
      <h5 class="mt-4 font-medium">Set up two-factor authentication</h5>
      <p class="mt-2 text-sm text-muted-foreground">
        Use an authenticator app like Google Authenticator or Authy to generate verification codes.
      </p>
      <Button class="mt-4" href="/auth?act=2fa-setup">
        <Shield class="size-4" />
        Enable 2FA
      </Button>
    </div>
  {:else}
    <Disable2FAForm bind:busy />
  {/if}
</div>
