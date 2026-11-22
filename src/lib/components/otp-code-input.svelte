<script lang="ts" module>
  import type { RemoteFormField } from "$app/server";

  export type OtpCodeInputProps = {
    /** The remote form's 6-digit code field. */
    field: RemoteFormField<string>;
    autofocus?: boolean;
  };
</script>

<script lang="ts">
  import * as InputOTP from "#lib/components/ui/input-otp/index.js";
  import { REGEXP_ONLY_DIGITS } from "bits-ui";

  let { field, autofocus = false }: OtpCodeInputProps = $props();

  const invalid = $derived(field.issues() ? "true" : "false");
</script>

<InputOTP.Root
  maxlength={6}
  name={field.as("text").name}
  onValueChange={(value) => field.set(value)}
  pattern={REGEXP_ONLY_DIGITS}
>
  {#snippet children({ cells })}
    <InputOTP.Group>
      {#each cells.slice(0, 3) as cell, i (cell)}
        <InputOTP.Slot {cell} autofocus={autofocus && i === 0} aria-invalid={invalid} />
      {/each}
    </InputOTP.Group>
    <InputOTP.Separator />
    <InputOTP.Group>
      {#each cells.slice(3, 6) as cell (cell)}
        <InputOTP.Slot {cell} aria-invalid={invalid} />
      {/each}
    </InputOTP.Group>
  {/snippet}
</InputOTP.Root>
