<script lang="ts" module>
  import type { AsyncState } from "$/types/state";
  import type { HTMLAttributes } from "svelte/elements";
  import type { WithElementRef } from "$/index";

  export type Setup2FAFormProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;

  type TwoFASetupState = {
    step: "idle" | "setup" | "complete";
    secret: string;
    otpauthUrl: string;
    recoveryCode: string;
  };
</script>

<script lang="ts">
  import { FieldGroup } from "$/components/ui/field/index.js";
  import { Button } from "$/components/ui/button/index.js";
  import { cn } from "$/utils/style.js";
  import { Loader, Shield, ShieldCheck, Copy, Check } from "$/assets/icons";
  import { onDestroy } from "svelte";
  import { generate2FASecret, verify2FA, signout } from "$/api/auth.remote";
  import { toast } from "svelte-sonner";
  import { isHttpError } from "@sveltejs/kit";
  import { showLoading, showSuccess, showWarning } from "$/components/toast";
  import * as QRCode from "$/components/ui/qr-code";
  import * as InputOTP from "$/components/ui/input-otp";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { goto } from "$app/navigation";

  let { ref = $bindable(null), class: className, ...restProps }: Setup2FAFormProps = $props();

  let status: AsyncState = $state("idle");

  let twoFASetup = $state<TwoFASetupState>({
    step: "idle",
    secret: "",
    otpauthUrl: "",
    recoveryCode: "",
  });

  let copiedRecovery = $state(false);

  function copyRecoveryCode() {
    navigator.clipboard.writeText(twoFASetup.recoveryCode);
    copiedRecovery = true;
    setTimeout(() => (copiedRecovery = false), 2000);
  }

  async function handleComplete() {
    // Redirect back to root with success toast
    showSuccess("Two-factor authentication enabled successfully!");
    await goto("/");
  }

  onDestroy(() => (status = "idle"));
</script>

<div class={cn("flex flex-col gap-6", className)} bind:this={ref} {...restProps}>
  <FieldGroup>
    <div class="flex flex-col items-center gap-1 text-center">
      <h1 class="text-2xl font-bold">Set up two-factor authentication</h1>
      <p class="text-sm text-balance text-muted-foreground">
        {#if twoFASetup.step === "idle"}
          Add an extra layer of security to your account using an authenticator app.
        {:else if twoFASetup.step === "setup"}
          Scan the QR code with your authenticator app and enter the verification code.
        {:else}
          Save your recovery code in a safe place.
        {/if}
      </p>
    </div>

    {#if twoFASetup.step === "idle"}
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
            if (status === "processing") return;
            status = "processing";
            const toastId = showLoading("Generating 2FA secret...");
            try {
              await submit();
              if (generate2FASecret.result?.secret && generate2FASecret.result?.otpauthUrl) {
                twoFASetup = {
                  step: "setup",
                  secret: generate2FASecret.result.secret,
                  otpauthUrl: generate2FASecret.result.otpauthUrl,
                  recoveryCode: "",
                };
                toast.dismiss(toastId);
              } else {
                showWarning("Failed to generate 2FA secret", undefined, undefined, {
                  id: toastId,
                });
              }
            } catch (e) {
              if (isHttpError(e)) {
                showWarning(e.body.message, undefined, undefined, { id: toastId });
              } else {
                showWarning("Failed to generate 2FA secret", undefined, undefined, {
                  id: toastId,
                });
              }
            } finally {
              status = "idle";
            }
          })}
        >
          <Button type="submit" disabled={status === "processing"}>
            {#if status === "processing"}
              <Loader class="size-4 animate-spin" />
              Generating...
            {:else}
              <Shield class="size-4" />
              Get Started
            {/if}
          </Button>
        </form>
      </div>
    {:else if twoFASetup.step === "setup"}
      <div class="space-y-4" transition:fly={{ y: 10, duration: 300, easing: cubicOut }}>
        <div class="rounded-lg border p-4">
          <h5 class="font-medium">Step 1: Scan QR Code</h5>
          <p class="mt-1 text-sm text-muted-foreground">
            Scan this QR code with your authenticator app.
          </p>
          <div class="mt-4 flex justify-center">
            <div class="rounded-lg bg-white p-3">
              <QRCode.Root value={twoFASetup.otpauthUrl} size={180} />
            </div>
          </div>
          <div class="mt-4">
            <p class="text-center text-xs text-muted-foreground">Or enter this code manually:</p>
            <code class="mt-2 block rounded bg-muted p-2 text-center font-mono text-sm break-all">
              {twoFASetup.secret}
            </code>
          </div>
        </div>

        <div class="rounded-lg border p-4">
          <h5 class="font-medium">Step 2: Enter Verification Code</h5>
          <p class="mt-1 text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app.
          </p>
          <form
            class="mt-4"
            {...verify2FA.enhance(async ({ submit }) => {
              if (status === "processing") return;
              status = "processing";
              const toastId = showLoading("Verifying code...");
              try {
                await submit();
                const issues = verify2FA.fields.allIssues?.() || [];
                if (issues.length > 0) {
                  showWarning(issues.map((i) => i.message).join(", "), undefined, undefined, {
                    id: toastId,
                  });
                } else if (verify2FA.result?.recoveryCode) {
                  twoFASetup.recoveryCode = verify2FA.result.recoveryCode;
                  twoFASetup.step = "complete";
                  showSuccess("2FA enabled successfully!", undefined, undefined, {
                    id: toastId,
                  });
                }
              } catch (e) {
                if (isHttpError(e)) {
                  showWarning(e.body.message, undefined, undefined, { id: toastId });
                } else {
                  showWarning("Failed to verify code", undefined, undefined, {
                    id: toastId,
                  });
                }
              } finally {
                status = "idle";
              }
            })}
          >
            <input type="hidden" name="secret" value={twoFASetup.secret} />
            <div class="flex flex-col items-center gap-4">
              <InputOTP.Root
                maxlength={6}
                name="code"
                aria-invalid={verify2FA.fields.code.issues() ? "true" : "false"}
                onValueChange={(value) => verify2FA.fields.code.set(value)}
              >
                {#snippet children({ cells })}
                  <InputOTP.Group>
                    {#each cells.slice(0, 3) as cell, i (cell)}
                      <InputOTP.Slot autofocus={i === 0} {cell} />
                    {/each}
                  </InputOTP.Group>
                  <InputOTP.Separator />
                  <InputOTP.Group>
                    {#each cells.slice(3, 6) as cell (cell)}
                      <InputOTP.Slot {cell} />
                    {/each}
                  </InputOTP.Group>
                {/snippet}
              </InputOTP.Root>
              <Button
                type="submit"
                class="w-full"
                disabled={(verify2FA.fields.code.value() &&
                  verify2FA.fields.code.value().length !== 6) ||
                  status === "processing"}
              >
                {#if status === "processing"}
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
    {:else if twoFASetup.step === "complete"}
      <div
        class="rounded-lg border border-green-500/50 bg-green-50 p-4 dark:bg-green-900/20"
        transition:fly={{ y: 10, duration: 300, easing: cubicOut }}
      >
        <div class="flex items-center gap-2">
          <ShieldCheck class="size-5 text-green-500" />
          <h5 class="font-medium text-green-700 dark:text-green-400">2FA Setup Complete!</h5>
        </div>
        <p class="mt-2 text-sm text-green-600 dark:text-green-300">
          Save your recovery code in a safe place. You'll need it if you lose access to your
          authenticator app.
        </p>
        <div class="mt-4 flex items-center gap-2">
          <code class="flex-1 rounded bg-white p-3 text-center font-mono text-lg dark:bg-gray-800">
            {twoFASetup.recoveryCode}
          </code>
          <Button variant="outline" size="icon" onclick={copyRecoveryCode}>
            {#if copiedRecovery}
              <Check class="size-4 text-green-500" />
            {:else}
              <Copy class="size-4" />
            {/if}
          </Button>
        </div>
        <Button class="mt-4 w-full" onclick={handleComplete}>
          <ShieldCheck class="size-4" />
          Done
        </Button>
      </div>
    {/if}
  </FieldGroup>
</div>

<div class="mt-4 flex justify-center">
  <form
    {...signout.enhance(async ({ submit }) => {
      const toastId = showLoading("Logging out...");
      try {
        await submit();
        showSuccess("Logged out successfully");
      } catch (e) {
        showWarning("Failed to logout. Please try again.");
      } finally {
        toast.dismiss(toastId);
      }
    })}
    class="flex"
  >
    <Button
      type="submit"
      variant="outline"
      disabled={status === "processing"}
      aria-label="Login with another account"
    >
      Login with another account
    </Button>
  </form>
</div>
