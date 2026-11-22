<script lang="ts" module>
  import type { HTMLAttributes } from "svelte/elements";
  import type { WithElementRef } from "#lib/index.js";

  export type Setup2FAFormProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;

  const SUBTITLE = {
    idle: "Add an extra layer of security to your account using an authenticator app.",
    setup: "Scan the QR code with your authenticator app and enter the verification code.",
    complete: "Save your recovery code in a safe place.",
  } as const;
</script>

<script lang="ts">
  import { FieldGroup } from "#lib/components/ui/field/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { cn } from "#lib/utils/style.js";
  import { Loader, Shield } from "#lib/assets/icons.js";
  import { generate2FASecret, signout } from "#lib/api/auth.remote.js";
  import { notifyResult } from "#lib/utils/notify.js";
  import { showWarning } from "#lib/components/toast/index.js";
  import Setup2FAVerify from "./setup-2fa-verify.svelte";
  import RecoveryCodePanel from "./recovery-code-panel.svelte";

  let { ref = $bindable(null), class: className, ...restProps }: Setup2FAFormProps = $props();

  let step: keyof typeof SUBTITLE = $state("idle");
  let busy = $state(false);
  let secret = $state("");
  let otpauthUrl = $state("");
  let recoveryCode = $state("");
</script>

<div class={cn("flex flex-col gap-6", className)} bind:this={ref} {...restProps}>
  <FieldGroup>
    <div class="flex flex-col items-center gap-1 text-center">
      <h1 class="text-2xl font-bold">Set up two-factor authentication</h1>
      <p class="text-sm text-balance text-muted-foreground">{SUBTITLE[step]}</p>
    </div>

    {#if step === "idle"}
      <div class="rounded-lg border border-dashed p-6 text-center">
        <Shield class="mx-auto size-12 text-muted-foreground/50" />
        <h5 class="mt-4 font-medium">Enable two-factor authentication</h5>
        <p class="mt-2 text-sm text-muted-foreground">
          Use an authenticator app like Google Authenticator or Authy to generate verification
          codes.
        </p>
        <form
          class="mt-4 inline-block"
          {...generate2FASecret.enhance(async ({ submit }) => {
            if (busy) return;
            busy = true;
            const ok = await notifyResult({
              loading: "Generating 2FA secret...",
              success: "Scan the QR code to continue",
              failure: "Failed to generate 2FA secret",
              run: submit,
            });
            busy = false;
            const result = generate2FASecret.result;
            if (!ok) return;
            if (!result?.secret || !result.otpauthUrl) {
              showWarning("Failed to generate 2FA secret");
              return;
            }
            secret = result.secret;
            otpauthUrl = result.otpauthUrl;
            step = "setup";
          })}
        >
          <Button type="submit" disabled={busy}>
            {#if busy}
              <Loader class="size-4 animate-spin" />
              Generating...
            {:else}
              <Shield class="size-4" />
              Get Started
            {/if}
          </Button>
        </form>
      </div>
    {:else if step === "setup"}
      <Setup2FAVerify
        {secret}
        {otpauthUrl}
        bind:busy
        oncomplete={(code) => {
          recoveryCode = code;
          step = "complete";
        }}
      />
    {:else}
      <RecoveryCodePanel code={recoveryCode} />
    {/if}
  </FieldGroup>
</div>

<div class="mt-4 flex justify-center">
  <form
    {...signout.enhance(async ({ submit }) => {
      await notifyResult({
        loading: "Logging out...",
        success: "Logged out successfully",
        failure: "Failed to logout. Please try again.",
        run: submit,
      });
    })}
    class="flex"
  >
    <Button type="submit" variant="outline" disabled={busy}>Login with another account</Button>
  </form>
</div>
