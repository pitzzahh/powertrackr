<script lang="ts" module>
  export type DeleteAccountTabProps = {
    user: App.Locals["user"];
    busy?: boolean;
    ondeleted: () => void;
  };

  const CONFIRMATIONS = [
    {
      title: "I understand this action is permanent",
      detail: "All data will be permanently deleted and cannot be recovered.",
    },
    {
      title: "I have backed up any important data",
      detail: "Ensure you've saved any information you need before proceeding.",
    },
    {
      title: "I want to permanently delete my account",
      detail: "Final confirmation to proceed with account deletion.",
    },
  ];

  const DELETED_ITEMS = [
    "Your profile and account information",
    "All billing information and history",
    "All sub-meter readings and payments",
    "All consumption data and analytics",
    "Your preferences and settings",
  ];
</script>

<script lang="ts">
  import { useModalFooter } from "#lib/components/dynamic-modal.svelte";
  import * as Field from "#lib/components/ui/field/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Checkbox } from "#lib/components/ui/checkbox/index.js";
  import { Label } from "#lib/components/ui/label/index.js";
  import { Loader, Trash2 } from "#lib/assets/icons.js";
  import { WarningBanner, LoadingDots } from "#lib/components/snippets.svelte";
  import { showInspectorWarning } from "#lib/components/toast/index.js";
  import { fieldInputProps } from "#lib/utils/field.js";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { deleteUser } from "#lib/api/user.remote.js";
  import { notifyResult } from "#lib/utils/notify.js";

  let { user, busy = $bindable(false), ondeleted }: DeleteAccountTabProps = $props();

  let checked = $state(CONFIRMATIONS.map(() => false));

  const emailMatches = $derived(deleteUser.fields.confirmEmail.value() === user?.email);
  const allConfirmed = $derived(emailMatches && checked.every(Boolean));

  function resetChecks() {
    checked = CONFIRMATIONS.map(() => false);
  }

  useModalFooter(actions);
</script>

<form
  id="account-delete-form"
  {...deleteUser.enhance(async ({ submit }) => {
    if (!allConfirmed) {
      showInspectorWarning();
      return;
    }
    if (busy) return;
    busy = true;
    const deleted = await notifyResult({
      loading: "Deleting account...",
      success: "Account deleted successfully",
      successDetail: "Redirecting to login...",
      failure: "Failed to delete account. Please try again.",
      run: submit,
      issues: () => deleteUser.fields.allIssues(),
    });
    busy = false;
    if (deleted) ondeleted();
  })}
  onreset={() => {
    deleteUser.fields.confirmEmail.set("");
    resetChecks();
  }}
  class="space-y-6"
>
  <div class="space-y-4">
    <h4 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">Danger Zone</h4>

    {@render WarningBanner({
      message:
        "This action cannot be undone. This will permanently delete your account and remove all your data from our servers.",
    })}

    <div class="rounded-lg border border-destructive/50 bg-destructive/0.5 p-4">
      <h5 class="text-sm font-semibold text-destructive">What will be deleted:</h5>
      <ul class="mt-2 list-inside list-disc space-y-1 text-sm text-destructive/90">
        {#each DELETED_ITEMS as item (item)}
          <li>{item}</li>
        {/each}
      </ul>
    </div>

    <Field.Group>
      <input type="hidden" {...deleteUser.fields.id.as("text")} value={user?.id ?? ""} />

      <Field.Field>
        <Field.Label for="delete-confirm-email" class="px-1">
          Type your email to confirm:
          <span class="font-mono text-accent-foreground">{user?.email}</span>
        </Field.Label>
        <Input
          id="delete-confirm-email"
          placeholder={user?.email}
          disabled={busy}
          class="text-center"
          autocomplete="off"
          {...fieldInputProps(deleteUser.fields.confirmEmail.as("email"))}
          oninput={(e) => {
            // Editing the email away from a match starts the confirmations over
            if (e.currentTarget.value !== user?.email) resetChecks();
          }}
        />
        <Field.Description>
          Enter your email address exactly as shown above to confirm deletion.
        </Field.Description>
        <Field.Error errors={deleteUser.fields.confirmEmail.issues()} />
      </Field.Field>
    </Field.Group>

    {#if emailMatches}
      <div class="space-y-3" transition:fly={{ y: 10, duration: 300, easing: cubicOut }}>
        <h5 class="text-sm font-semibold text-destructive">
          Please confirm the following to proceed:
        </h5>
        {#each CONFIRMATIONS as item, i (item.title)}
          <!-- Each box appears once every box before it is ticked -->
          {#if checked.slice(0, i).every(Boolean)}
            <div transition:fly={{ y: 10, duration: 300, delay: i ? 100 : 0, easing: cubicOut }}>
              <Label
                class="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 has-aria-checked:border-destructive has-aria-checked:bg-destructive/20"
              >
                <Checkbox
                  bind:checked={checked[i]}
                  disabled={busy}
                  class="data-[state=checked]:border-destructive data-[state=checked]:bg-destructive"
                />
                <div class="grid gap-1.5 font-normal">
                  <p class="text-sm leading-none font-medium">{item.title}</p>
                  <p class="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </Label>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</form>

{#snippet actions()}
  <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <Button type="reset" form="account-delete-form" variant="outline" disabled={busy}>Clear</Button>
    <Button
      type="submit"
      form="account-delete-form"
      variant="destructive"
      disabled={!allConfirmed || busy}
      class="min-w-32"
    >
      {#if busy}
        <Loader class="size-4 animate-spin" />
        Deleting
        {@render LoadingDots()}
      {:else}
        <Trash2 class="size-4" />
        Delete Account
      {/if}
    </Button>
  </div>
{/snippet}
