<script lang="ts" module>
  export type Setup2FAVerifyProps = {
    secret: string;
    otpauthUrl: string;
    busy?: boolean;
    oncomplete: (recoveryCode: string) => void;
  };
</script>

<script lang="ts">
  import { Button } from "#lib/components/ui/button/index.js";
  import * as QRCode from "#lib/components/ui/qr-code/index.js";
  import OtpCodeInput from "#lib/components/otp-code-input.svelte";
  import { Loader } from "#lib/assets/icons.js";
  import { verify2FA } from "#lib/api/auth.remote.js";
  import { notifyResult } from "#lib/utils/notify.js";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  let { secret, otpauthUrl, busy = $bindable(false), oncomplete }: Setup2FAVerifyProps = $props();
</script>

<div class="grid gap-4 md:grid-cols-2" transition:fly={{ y: 10, duration: 300, easing: cubicOut }}>
  <div class="rounded-lg border p-4">
    <h5 class="font-medium">Step 1: Scan QR Code</h5>
    <p class="mt-1 text-sm text-muted-foreground">Scan this QR code with your authenticator app.</p>
    <div class="mt-4 flex items-center justify-center">
      <QRCode.Root value={otpauthUrl} size={220} logo="/logo/favicon.png" />
    </div>
    <p class="mt-4 text-center text-xs text-muted-foreground">Or enter this code manually:</p>
    <code class="mt-2 block rounded bg-muted p-2 text-center font-mono text-sm break-all">
      {secret}
    </code>
  </div>

  <div class="rounded-lg border p-4">
    <h5 class="font-medium">Step 2: Enter Verification Code</h5>
    <p class="mt-1 text-sm text-muted-foreground">
      Enter the 6-digit code from your authenticator app.
    </p>
    <form
      class="mt-4"
      {...verify2FA.enhance(async ({ submit }) => {
        if (busy) return;
        busy = true;
        const ok = await notifyResult({
          loading: "Verifying code...",
          success: "2FA enabled successfully!",
          failure: "Failed to verify code",
          run: submit,
          issues: () => verify2FA.fields.allIssues(),
        });
        busy = false;
        if (ok && verify2FA.result?.recoveryCode) oncomplete(verify2FA.result.recoveryCode);
      })}
    >
      <input {...verify2FA.fields.secret.as("hidden", secret)} />
      <div class="flex flex-col items-center gap-4">
        <OtpCodeInput field={verify2FA.fields.code} autofocus />
        <Button
          type="submit"
          class="w-full"
          disabled={verify2FA.fields.code.value()?.length !== 6 || busy}
        >
          {#if busy}
            <Loader class="size-4 animate-spin" />
            Verifying...
          {:else}
            Verify & Enable
          {/if}
        </Button>
      </div>
    </form>
  </div>
</div>
