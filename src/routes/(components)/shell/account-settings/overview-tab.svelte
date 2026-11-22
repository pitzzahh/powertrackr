<script lang="ts" module>
  export type OverviewTabProps = {
    user: App.Locals["user"];
    busy?: boolean;
    oncancel: () => void;
  };

  const ON = "bg-success/12 text-success-strong";
</script>

<script lang="ts">
  import { useModalFooter } from "#lib/components/dynamic-modal.svelte";
  import * as Field from "#lib/components/ui/field/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Separator } from "#lib/components/ui/separator/index.js";
  import { Badge } from "#lib/components/ui/badge/index.js";
  import { Loader, User } from "#lib/assets/icons.js";
  import { cn } from "#lib/utils/style.js";
  import { updateUser } from "#lib/api/user.remote.js";
  import { notifyResult } from "#lib/utils/notify.js";

  let { user, busy = $bindable(false), oncancel }: OverviewTabProps = $props();

  const statuses = $derived([
    {
      label: "Email Verification",
      on: !!user?.emailVerified,
      detail: user?.emailVerified ? "Your email is verified" : "Email not verified",
      badge: user?.emailVerified ? "Verified" : "Pending",
      off: "bg-warning/15 text-warning-strong",
    },
    {
      label: "Two-Factor Authentication",
      on: !!user?.registeredTwoFactor,
      detail: user?.registeredTwoFactor ? "2FA is enabled" : "2FA not enabled",
      badge: user?.registeredTwoFactor ? "Enabled" : "Disabled",
      off: "bg-muted text-muted-foreground",
    },
  ]);

  useModalFooter(actions);
</script>

<form
  id="account-overview-form"
  {...updateUser.enhance(async ({ submit }) => {
    if (busy) return;
    busy = true;
    await notifyResult({
      loading: "Updating profile...",
      success: "Profile updated successfully",
      failure: "Failed to update profile. Please try again.",
      run: submit,
      issues: () => updateUser.fields.allIssues(),
    });
    busy = false;
  })}
  class="space-y-6"
>
  <div class="space-y-4">
    <h4 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
      Profile Information
    </h4>

    <Field.Group>
      <Field.Field>
        <Field.Label for="account-name" class="px-1">Name</Field.Label>
        <Input
          id="account-name"
          placeholder="Your name"
          disabled={busy}
          {...updateUser.fields.name.as("text")}
          value={user?.name ?? ""}
        />
        <Field.Description>Your display name</Field.Description>
        <Field.Error errors={updateUser.fields.name.issues()} />
      </Field.Field>

      <Field.Field>
        <Field.Label for="account-email" class="px-1">Email</Field.Label>
        <Input
          id="account-email"
          placeholder="your@email.com"
          disabled={busy}
          {...updateUser.fields.email.as("email")}
          value={user?.email ?? ""}
        />
        <Field.Description>Your email address. Used for login and notifications.</Field.Description>
        <Field.Error errors={updateUser.fields.email.issues()} />
      </Field.Field>

      <Field.Field>
        <Field.Label for="account-image" class="px-1">
          Profile Image <span class="text-muted-foreground">(Optional)</span>
        </Field.Label>
        <Input
          id="account-image"
          type="url"
          placeholder="https://example.com/avatar.jpg"
          disabled={busy}
          {...updateUser.fields.image.as("text")}
          value={user?.image ?? ""}
        />
        <Field.Description>
          URL to your profile image. Leave empty for default avatar.
        </Field.Description>
        <Field.Error errors={updateUser.fields.image.issues()} />
      </Field.Field>
    </Field.Group>
  </div>

  <Separator />

  <div class="space-y-4">
    <h4 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
      Security Status
    </h4>

    <div class="grid gap-4 md:grid-cols-2">
      {#each statuses as status (status.label)}
        <div class="flex items-center justify-between rounded-lg border p-4">
          <div class="space-y-0.5">
            <div class="text-sm font-medium">{status.label}</div>
            <div class="text-xs text-muted-foreground">{status.detail}</div>
          </div>
          <Badge class={cn(status.on ? ON : status.off)}>{status.badge}</Badge>
        </div>
      {/each}
    </div>
  </div>
</form>

{#snippet actions()}
  <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <Button type="button" variant="outline" onclick={oncancel} disabled={busy}>Cancel</Button>
    <Button type="submit" form="account-overview-form" disabled={busy} class="min-w-32">
      {#if busy}
        <Loader class="size-4 animate-spin" />
        Saving...
      {:else}
        <User class="size-4" />
        Save Changes
      {/if}
    </Button>
  </div>
{/snippet}
