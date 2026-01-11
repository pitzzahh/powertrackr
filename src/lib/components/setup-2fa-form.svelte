<script lang="ts" module>
  import type { Status } from "$/types/state";
  import type { HTMLFormAttributes } from "svelte/elements";
  import type { WithElementRef } from "..";
  export type Setup2FAFormProps = WithElementRef<HTMLFormAttributes>;
</script>

<script lang="ts">
  import {
    FieldGroup,
    Field,
    FieldLabel,
    FieldDescription,
    FieldError,
  } from "$/components/ui/field/index.js";
  import { Input } from "$/components/ui/input/index.js";
  import { Button } from "$/components/ui/button/index.js";
  import { cn } from "$/utils/style.js";
  import { Loader, BadgeCheck } from "$/assets/icons";
  import { onDestroy } from "svelte";
  import { setup2FA } from "$/api/auth.remote";
  import { toast } from "svelte-sonner";
  import { isHttpError } from "@sveltejs/kit";
  import { showError, showLoading, showSuccess } from "./toast";

  let { ref = $bindable(null), class: className, ...restProps }: Setup2FAFormProps = $props();

  let { status }: { status: Status } = $state({
    status: "idle",
  });

  const id = $props.id();

  onDestroy(() => (status = "idle"));
</script>

powertrackr/src/lib/components/setup-2fa-form.svelte
<form
  {...setup2FA.enhance(async ({ submit }) => {
    status = "processing";
    const toastId = showLoading("Setting up two-factor authentication...");
    try {
      await submit();
      showSuccess("Two-factor authentication set up successfully");
    } catch (e) {
      const message = isHttpError(e) ? e.body.message : String(e);
      console.log({ e });
      showError(message || "Failed to set up 2FA. Please try again.");
    } finally {
      toast.dismiss(toastId);
      status = "idle";
    }
  })}
  class={cn("flex flex-col gap-6", className)}
  bind:this={ref}
  {...restProps}
>
  <FieldGroup>
    <div class="flex flex-col items-center gap-1 text-center">
      <h1 class="text-2xl font-bold">Set up two-factor authentication</h1>
      <p class="text-sm text-balance text-muted-foreground">
        Scan the QR code with your authenticator app and enter the code to enable 2FA.
      </p>
    </div>
    <Field>
      <div class="flex justify-center">
        <!-- Placeholder for QR code -->
        <div class="flex h-48 w-48 items-center justify-center rounded-lg bg-muted">
          <BadgeCheck class="size-12 text-muted-foreground" />
          <span class="sr-only">QR code placeholder</span>
        </div>
      </div>
      <FieldDescription class="text-center">QR code for authenticator app</FieldDescription>
    </Field>
    <Field>
      <FieldLabel for="code-{id}">Verification Code</FieldLabel>
      <Input
        id="code-{id}"
        placeholder="Enter 6-digit code"
        required
        autocomplete="one-time-code"
        {...setup2FA.fields.code.as("text")}
      />
      <FieldError errors={setup2FA.fields.code.issues()} />
    </Field>
    <Field>
      <Button type="submit" disabled={status === "processing"} aria-label="Set up 2FA">
        {#if status === "processing"}
          <Loader class="size-5 animate-spin" />
        {:else}
          <BadgeCheck class="size-5" />
          Enable 2FA
        {/if}
      </Button>
    </Field>
  </FieldGroup>
</form>
