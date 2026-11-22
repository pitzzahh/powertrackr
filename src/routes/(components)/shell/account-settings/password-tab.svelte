<script lang="ts" module>
  export type PasswordTabProps = { busy?: boolean };

  const FIELDS = [
    {
      key: "currentPassword",
      id: "current-password",
      label: "Current Password",
      placeholder: "Enter current password",
      autocomplete: "current-password",
      progress: false,
      requirements: false,
      hint: "Enter your current password to verify your identity.",
    },
    {
      key: "newPassword",
      id: "new-password",
      label: "New Password",
      placeholder: "Enter new password",
      autocomplete: "new-password",
      progress: true,
      requirements: true,
      hint: "Password must be at least 8 characters long.",
    },
    {
      key: "confirmPassword",
      id: "confirm-password",
      label: "Confirm New Password",
      placeholder: "Confirm new password",
      autocomplete: "new-password",
      progress: true,
      requirements: false,
      hint: "Re-enter your new password to confirm.",
    },
  ] as const;
</script>

<script lang="ts">
  import { useModalFooter } from "#lib/components/dynamic-modal.svelte";
  import * as Field from "#lib/components/ui/field/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import Password from "#lib/components/password.svelte";
  import { Loader, Lock } from "#lib/assets/icons.js";
  import { changePassword } from "#lib/api/auth.remote.js";
  import { notifyResult } from "#lib/utils/notify.js";

  let { busy = $bindable(false) }: PasswordTabProps = $props();

  useModalFooter(actions);
</script>

<form
  id="account-password-form"
  {...changePassword.enhance(async ({ submit, element }) => {
    if (busy) return;
    busy = true;
    const saved = await notifyResult({
      loading: "Changing password...",
      success: "Password changed successfully",
      failure: "Failed to change password. Please try again.",
      run: submit,
      issues: () => changePassword.fields.allIssues(),
    });
    if (saved) element.reset();
    busy = false;
  })}
  class="space-y-6"
>
  <div class="space-y-4">
    <h4 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
      Change Password
    </h4>

    <Field.Group>
      {#each FIELDS as f (f.key)}
        <Field.Field>
          <Field.Label for={f.id} class="px-1">{f.label}</Field.Label>
          <Password
            id={f.id}
            placeholder={f.placeholder}
            disabled={busy}
            autocomplete={f.autocomplete}
            showProgress={f.progress}
            showRequirements={f.requirements}
            {...changePassword.fields[f.key].as("password")}
          />
          <Field.Description>{f.hint}</Field.Description>
          <Field.Error errors={changePassword.fields[f.key].issues()} />
        </Field.Field>
      {/each}
    </Field.Group>
  </div>
</form>

{#snippet actions()}
  <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <Button type="reset" form="account-password-form" variant="outline" disabled={busy}>
      Clear
    </Button>
    <Button type="submit" form="account-password-form" disabled={busy} class="min-w-32">
      {#if busy}
        <Loader class="size-4 animate-spin" />
        Changing...
      {:else}
        <Lock class="size-4" />
        Change Password
      {/if}
    </Button>
  </div>
{/snippet}
