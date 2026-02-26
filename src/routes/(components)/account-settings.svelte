<script lang="ts" module>
  import type { Snippet } from "svelte";

  export type AccountSettingsProps = {
    user: App.Locals["user"];
    trigger?: Snippet;
    openAccountSettings?: boolean;
  };

  type AccountSettingsState = {
    activeTab: "overview" | "change-password" | "security" | "delete-account";
    overviewAsyncState: AsyncState;
    passwordAsyncState: AsyncState;
    securityAsyncState: AsyncState;
    deleteAsyncState: AsyncState;
  };
</script>

<script lang="ts">
  import * as Drawer from "$/components/ui/drawer/index.js";
  import { MediaQuery } from "svelte/reactivity";
  import * as Dialog from "$/components/ui/dialog";
  import * as UnderlineTabs from "$/components/underline-tabs";
  import * as Field from "$/components/ui/field/index.js";
  import { Input } from "$/components/ui/input/index.js";
  import { Button } from "$/components/ui/button/index.js";
  import { Separator } from "$/components/ui/separator/index.js";
  import { ScrollArea } from "$/components/ui/scroll-area";
  import { Loader, Lock, User, Trash2, Shield, ShieldCheck, ShieldOff } from "$lib/assets/icons.js";
  import { Badge } from "$/components/ui/badge";
  import { toast } from "svelte-sonner";
  import type { AsyncState } from "$/types/state";
  import { WarningBanner, LoadingDots } from "$/components/snippets.svelte";
  import { showInspectorWarning, showLoading, showSuccess, showWarning } from "$/components/toast";
  import { updateUser, deleteUser } from "$/api/user.remote";
  import { changePassword, disable2FA } from "$/api/auth.remote";
  import * as InputOTP from "$/components/ui/input-otp";
  import { isHttpError } from "@sveltejs/kit";
  import * as Password from "$/components/password";
  import { Checkbox } from "$/components/ui/checkbox/index.js";
  import { Label } from "$/components/ui/label/index.js";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { REGEXP_ONLY_DIGITS } from "bits-ui";

  let { user, trigger, openAccountSettings = $bindable(false) }: AccountSettingsProps = $props();

  const isDesktop = new MediaQuery("(min-width: 768px)");

  let { activeTab, overviewAsyncState, passwordAsyncState, securityAsyncState, deleteAsyncState } =
    $state<AccountSettingsState>({
      activeTab: "overview",
      overviewAsyncState: "idle",
      passwordAsyncState: "idle",
      securityAsyncState: "idle",
      deleteAsyncState: "idle",
    });

  let { deleteCheckbox1 } = $derived({ deleteCheckbox1: false });
  let { deleteCheckbox2 } = $derived({ deleteCheckbox2: !deleteCheckbox1 });
  let { deleteCheckbox3 } = $derived({ deleteCheckbox3: !deleteCheckbox2 });

  const emailMatches = $derived(deleteUser.fields.confirmEmail.value() === user?.email);
  const allConfirmed = $derived(
    emailMatches && deleteCheckbox1 && deleteCheckbox2 && deleteCheckbox3
  );

  $effect(() => {
    if (!emailMatches) {
      deleteCheckbox1 = false;
      deleteCheckbox2 = false;
      deleteCheckbox3 = false;
    }
  });
</script>

{#if isDesktop.current}
  <Dialog.Root
    bind:open={openAccountSettings}
    onOpenChange={(open) => {
      if (
        !open &&
        (overviewAsyncState === "processing" ||
          passwordAsyncState === "processing" ||
          deleteAsyncState === "processing")
      ) {
        showWarning("Process Interrupted", "The operation is still processing. Please wait...");
        openAccountSettings = true;
      }
    }}
  >
    {#if trigger}
      <Dialog.Trigger>
        {@render trigger?.()}
      </Dialog.Trigger>
    {/if}
    <Dialog.Content
      class="flex h-[80vh] flex-col overflow-hidden md:h-[75vh] md:max-w-175 lg:max-w-350"
    >
      <Dialog.Header>
        <Dialog.Title>Account Settings</Dialog.Title>
        <Dialog.Description>Manage your account settings and preferences.</Dialog.Description>
      </Dialog.Header>
      <div class="min-h-0 flex-1 overflow-hidden">
        {@render content()}
      </div>
    </Dialog.Content>
  </Dialog.Root>
{:else}
  <Drawer.Root
    bind:open={openAccountSettings}
    onOpenChange={(open) => {
      if (
        !open &&
        (overviewAsyncState === "processing" ||
          passwordAsyncState === "processing" ||
          deleteAsyncState === "processing")
      ) {
        showWarning("Process Interrupted", "The operation is still processing. Please wait...");
        openAccountSettings = true;
      }
    }}
  >
    {#if trigger}
      <Drawer.Trigger>
        {@render trigger?.()}
      </Drawer.Trigger>
    {/if}
    <Drawer.Content class="flex h-[85vh] flex-col">
      <Drawer.Header class="text-start">
        <Drawer.Title>Account Settings</Drawer.Title>
        <Drawer.Description>Manage your account settings and preferences.</Drawer.Description>
      </Drawer.Header>
      <div class="min-h-0 flex-1 overflow-hidden p-2">
        {@render content()}
      </div>
    </Drawer.Content>
  </Drawer.Root>
{/if}

{#snippet content()}
  <UnderlineTabs.Root bind:value={activeTab} class="flex h-full flex-col">
    <UnderlineTabs.List class="w-full justify-center md:w-auto md:justify-start">
      <UnderlineTabs.Trigger class="flex-1 md:flex-none" value="overview"
        >Overview</UnderlineTabs.Trigger
      >
      <UnderlineTabs.Trigger class="flex-1 md:flex-none" value="change-password"
        >Change Password</UnderlineTabs.Trigger
      >
      <UnderlineTabs.Trigger class="flex-1 md:flex-none" value="security"
        >Security</UnderlineTabs.Trigger
      >
      <UnderlineTabs.Trigger class="flex-1 md:flex-none" value="delete-account"
        >Delete Account</UnderlineTabs.Trigger
      >
    </UnderlineTabs.List>

    <UnderlineTabs.Content value="overview" class="min-h-0 flex-1">
      <ScrollArea orientation="vertical" class="h-full">
        <div class="p-1 pr-3">
          <form
            {...updateUser.enhance(async ({ submit }) => {
              if (overviewAsyncState === "processing") return;
              overviewAsyncState = "processing";
              const toastId = showLoading("Updating profile...");
              try {
                await submit();
                const issues = updateUser.fields.allIssues?.() || [];
                if (issues.length > 0) {
                  showWarning(issues.map((i) => i.message).join(", "), undefined, undefined, {
                    id: toastId,
                  });
                } else {
                  showSuccess("Profile updated successfully", undefined, undefined, {
                    id: toastId,
                  });
                }
              } catch (e) {
                const message = isHttpError(e) ? e.body.message : String(e);
                showWarning(
                  message || "Failed to update profile. Please try again.",
                  undefined,
                  undefined,
                  {
                    id: toastId,
                  }
                );
              } finally {
                toast.dismiss(toastId);
                overviewAsyncState = "idle";
              }
            })}
            class="space-y-6"
          >
            <div class="space-y-4">
              <h4 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                Profile Information
              </h4>

              <Field.Group>
                <input type="hidden" {...updateUser.fields.id.as("text")} value={user?.id ?? ""} />

                <Field.Field>
                  <Field.Label for="account-name" class="px-1">Name</Field.Label>
                  <Input
                    id="account-name"
                    placeholder="Your name"
                    disabled={overviewAsyncState === "processing"}
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
                    disabled={overviewAsyncState === "processing"}
                    {...updateUser.fields.email.as("email")}
                    value={user?.email ?? ""}
                  />
                  <Field.Description>
                    Your email address. Used for login and notifications.
                  </Field.Description>
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
                    disabled={overviewAsyncState === "processing"}
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
                <div class="flex items-center justify-between rounded-lg border p-4">
                  <div class="space-y-0.5">
                    <div class="text-sm font-medium">Email Verification</div>
                    <div class="text-xs text-muted-foreground">
                      {user?.emailVerified ? "Your email is verified" : "Email not verified"}
                    </div>
                  </div>
                  <Badge
                    class={[
                      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                      {
                        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400":
                          user?.emailVerified,
                      },
                    ]}
                  >
                    {user?.emailVerified ? "Verified" : "Pending"}
                  </Badge>
                </div>

                <div class="flex items-center justify-between rounded-lg border p-4">
                  <div class="space-y-0.5">
                    <div class="text-sm font-medium">Two-Factor Authentication</div>
                    <div class="text-xs text-muted-foreground">
                      {user?.registeredTwoFactor ? "2FA is enabled" : "2FA not enabled"}
                    </div>
                  </div>
                  <Badge
                    class={[
                      "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
                      {
                        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400":
                          user?.registeredTwoFactor,
                      },
                    ]}
                  >
                    {user?.registeredTwoFactor ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div class="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onclick={() => (openAccountSettings = false)}
                disabled={overviewAsyncState === "processing"}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={overviewAsyncState === "processing"} class="min-w-32">
                {#if overviewAsyncState === "processing"}
                  <Loader class="size-4 animate-spin" />
                  Saving...
                {:else}
                  <User class="size-4" />
                  Save Changes
                {/if}
              </Button>
            </div>
          </form>
        </div>
      </ScrollArea>
    </UnderlineTabs.Content>

    <UnderlineTabs.Content value="change-password" class="min-h-0 flex-1">
      <ScrollArea orientation="vertical" class="h-full">
        <div class="p-1 pr-3">
          <form
            {...changePassword.enhance(async ({ submit, form }) => {
              if (passwordAsyncState === "processing") return;
              passwordAsyncState = "processing";
              const toastId = showLoading("Changing password...");
              try {
                await submit();
                const issues = changePassword.fields.allIssues?.() || [];
                if (issues.length > 0) {
                  showWarning(issues.map((i) => i.message).join(", "), undefined, undefined, {
                    id: toastId,
                  });
                } else {
                  form.reset();
                  showSuccess("Password changed successfully", undefined, undefined, {
                    id: toastId,
                  });
                }
              } catch (e) {
                const message = isHttpError(e) ? e.body.message : String(e);
                showWarning(
                  message || "Failed to change password. Please try again.",
                  undefined,
                  undefined,
                  {
                    id: toastId,
                  }
                );
              } finally {
                toast.dismiss(toastId);
                passwordAsyncState = "idle";
              }
            })}
            class="space-y-6"
          >
            <div class="space-y-4">
              <h4 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                Change Password
              </h4>

              <Field.Group>
                <Field.Field>
                  <Field.Label for="current-password" class="px-1">Current Password</Field.Label>
                  <Password.Root>
                    <Password.Input
                      id="current-password"
                      placeholder="Enter current password"
                      disabled={passwordAsyncState === "processing"}
                      autocomplete="current-password"
                      {...changePassword.fields.currentPassword.as("password")}
                    >
                      <Password.ToggleVisibility />
                    </Password.Input>
                  </Password.Root>
                  <Field.Description>
                    Enter your current password to verify your identity.
                  </Field.Description>
                  <Field.Error errors={changePassword.fields.currentPassword.issues()} />
                </Field.Field>

                <Field.Field>
                  <Field.Label for="new-password" class="px-1">New Password</Field.Label>
                  <Password.Root enableStrengthCheck>
                    <Password.Input
                      id="new-password"
                      placeholder="Enter new password"
                      disabled={passwordAsyncState === "processing"}
                      autocomplete="new-password"
                      {...changePassword.fields.newPassword.as("password")}
                    >
                      <Password.ToggleVisibility />
                    </Password.Input>
                    <Password.Strength />
                  </Password.Root>
                  <Field.Description>
                    Password must be at least 8 characters long.
                  </Field.Description>
                  <Field.Error errors={changePassword.fields.newPassword.issues()} />
                </Field.Field>

                <Field.Field>
                  <Field.Label for="confirm-password" class="px-1">Confirm New Password</Field.Label
                  >
                  <Password.Root>
                    <Password.Input
                      id="confirm-password"
                      placeholder="Confirm new password"
                      disabled={passwordAsyncState === "processing"}
                      autocomplete="new-password"
                      {...changePassword.fields.confirmPassword.as("password")}
                    >
                      <Password.ToggleVisibility />
                    </Password.Input>
                    <Password.Strength />
                  </Password.Root>
                  <Field.Description>Re-enter your new password to confirm.</Field.Description>
                  <Field.Error errors={changePassword.fields.confirmPassword.issues()} />
                </Field.Field>
              </Field.Group>
            </div>

            <Separator />

            <div class="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onclick={(e) => {
                  const form = e.currentTarget.closest("form");
                  form?.reset();
                }}
                disabled={passwordAsyncState === "processing"}
              >
                Clear
              </Button>
              <Button type="submit" disabled={passwordAsyncState === "processing"} class="min-w-32">
                {#if passwordAsyncState === "processing"}
                  <Loader class="size-4 animate-spin" />
                  Changing...
                {:else}
                  <Lock class="size-4" />
                  Change Password
                {/if}
              </Button>
            </div>
          </form>
        </div>
      </ScrollArea>
    </UnderlineTabs.Content>

    <UnderlineTabs.Content value="security" class="min-h-0 flex-1">
      <ScrollArea orientation="vertical" class="h-full">
        <div class="space-y-6 p-1 pr-3">
          <div class="space-y-4">
            <h4 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Two-Factor Authentication
            </h4>

            <div class="rounded-lg border p-4">
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    {#if user?.registeredTwoFactor}
                      <ShieldCheck class="size-5 text-green-500" />
                      <span class="font-medium">2FA is enabled</span>
                    {:else}
                      <ShieldOff class="size-5 text-muted-foreground" />
                      <span class="font-medium">2FA is not enabled</span>
                    {/if}
                  </div>
                  <p class="text-sm text-muted-foreground">
                    {#if user?.registeredTwoFactor}
                      Your account is protected with two-factor authentication.
                    {:else}
                      Add an extra layer of security to your account.
                    {/if}
                  </p>
                </div>
                <Badge
                  class={[
                    "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
                    {
                      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400":
                        user?.registeredTwoFactor,
                    },
                  ]}
                >
                  {user?.registeredTwoFactor ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>

            {#if !user?.registeredTwoFactor}
              <div class="rounded-lg border border-dashed p-6 text-center">
                <Shield class="mx-auto size-12 text-muted-foreground/50" />
                <h5 class="mt-4 font-medium">Set up two-factor authentication</h5>
                <p class="mt-2 text-sm text-muted-foreground">
                  Use an authenticator app like Google Authenticator or Authy to generate
                  verification codes.
                </p>
                <Button class="mt-4" href="/auth?act=2fa-setup">
                  <Shield class="size-4" />
                  Enable 2FA
                </Button>
              </div>
            {:else}
              <div class="rounded-lg border border-destructive/50 bg-destructive/0.5 p-4">
                <h5 class="font-medium text-destructive">Disable Two-Factor Authentication</h5>
                <p class="mt-1 text-sm text-destructive/80">
                  Enter your current 2FA code to disable two-factor authentication.
                </p>
                <form
                  class="mt-4"
                  {...disable2FA.enhance(async ({ submit, form }) => {
                    if (securityAsyncState === "processing") return;
                    securityAsyncState = "processing";
                    const toastId = showLoading("Disabling 2FA...");
                    try {
                      await submit();
                      const issues = disable2FA.fields.allIssues?.() || [];
                      if (issues.length > 0) {
                        showWarning(issues.map((i) => i.message).join(", "), undefined, undefined, {
                          id: toastId,
                        });
                      } else {
                        form.reset();
                        showSuccess("2FA disabled successfully", undefined, undefined, {
                          id: toastId,
                        });
                      }
                    } catch (e) {
                      if (isHttpError(e)) {
                        showWarning(e.body.message, undefined, undefined, { id: toastId });
                      } else {
                        showWarning("Failed to disable 2FA", undefined, undefined, { id: toastId });
                      }
                    } finally {
                      securityAsyncState = "idle";
                    }
                  })}
                >
                  <div class="flex flex-col items-center gap-4">
                    <InputOTP.Root
                      maxlength={6}
                      name="code"
                      onValueChange={(value) => disable2FA.fields.code.set(value)}
                      pattern={REGEXP_ONLY_DIGITS}
                    >
                      {#snippet children({ cells })}
                        <InputOTP.Group>
                          {#each cells.slice(0, 3) as cell (cell)}
                            <InputOTP.Slot
                              {cell}
                              aria-invalid={disable2FA.fields.code.issues() ? "true" : "false"}
                            />
                          {/each}
                        </InputOTP.Group>
                        <InputOTP.Separator />
                        <InputOTP.Group>
                          {#each cells.slice(3, 6) as cell (cell)}
                            <InputOTP.Slot
                              {cell}
                              aria-invalid={disable2FA.fields.code.issues() ? "true" : "false"}
                            />
                          {/each}
                        </InputOTP.Group>
                      {/snippet}
                    </InputOTP.Root>
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={disable2FA.fields?.code?.value()?.length !== 6 ||
                        securityAsyncState === "processing"}
                    >
                      {#if securityAsyncState === "processing"}
                        <Loader class="size-4 animate-spin" />
                        Disabling...
                      {:else}
                        <ShieldOff class="size-4" />
                        Disable 2FA
                      {/if}
                    </Button>
                  </div>
                </form>
              </div>
            {/if}
          </div>
        </div>
      </ScrollArea>
    </UnderlineTabs.Content>

    <UnderlineTabs.Content value="delete-account" class="min-h-0 flex-1">
      <ScrollArea orientation="vertical" class="h-full">
        <div class="p-1 pr-3">
          <form
            {...deleteUser.enhance(async ({ submit }) => {
              if (!allConfirmed) {
                showInspectorWarning();
                return;
              }
              if (deleteAsyncState === "processing") return;
              deleteAsyncState = "processing";
              const toastId = showLoading("Deleting account...");
              try {
                await submit();
                const issues = deleteUser.fields.allIssues?.() || [];
                if (issues.length > 0) {
                  showWarning(issues.map((i) => i.message).join(", "), undefined, undefined, {
                    id: toastId,
                  });
                } else {
                  showSuccess(
                    "Account deleted successfully",
                    "Redirecting to login...",
                    undefined,
                    {
                      id: toastId,
                    }
                  );
                  openAccountSettings = false;
                }
              } catch (e) {
                const message = isHttpError(e) ? e.body.message : String(e);
                showWarning(
                  message || "Failed to delete account. Please try again.",
                  undefined,
                  undefined,
                  {
                    id: toastId,
                  }
                );
              } finally {
                toast.dismiss(toastId);
                deleteAsyncState = "idle";
              }
            })}
            class="space-y-6"
          >
            <div class="space-y-4">
              <h4 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                Danger Zone
              </h4>

              {@render WarningBanner({
                message:
                  "This action cannot be undone. This will permanently delete your account and remove all your data from our servers.",
              })}

              <div class="rounded-lg border border-destructive/50 bg-destructive/0.5 p-4">
                <div class="space-y-3">
                  <div>
                    <h5 class="text-sm font-semibold text-destructive">What will be deleted:</h5>
                    <ul class="mt-2 list-inside list-disc space-y-1 text-sm text-destructive/90">
                      <li>Your profile and account information</li>
                      <li>All billing information and history</li>
                      <li>All sub-meter readings and payments</li>
                      <li>All consumption data and analytics</li>
                      <li>Your preferences and settings</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Field.Group>
                <input type="hidden" {...deleteUser.fields.id.as("text")} value={user?.id ?? ""} />

                <Field.Field>
                  <Field.Label for="delete-confirm-email" class="px-1">
                    Type your email to confirm:
                    <span class="font-mono text-primary">{user?.email}</span>
                  </Field.Label>
                  <Input
                    id="delete-confirm-email"
                    placeholder={user?.email}
                    disabled={deleteAsyncState === "processing"}
                    class="text-center"
                    autocomplete="off"
                    {...deleteUser.fields.confirmEmail.as("email")}
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

                  <Label
                    class="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 has-aria-checked:border-destructive has-aria-checked:bg-destructive/20"
                  >
                    <Checkbox
                      id="delete-confirm-1"
                      bind:checked={deleteCheckbox1}
                      disabled={deleteAsyncState === "processing"}
                      class="data-[state=checked]:border-destructive data-[state=checked]:bg-destructive"
                    />
                    <div class="grid gap-1.5 font-normal">
                      <p class="text-sm leading-none font-medium">
                        I understand this action is permanent
                      </p>
                      <p class="text-xs text-muted-foreground">
                        All data will be permanently deleted and cannot be recovered.
                      </p>
                    </div>
                  </Label>

                  {#if deleteCheckbox1}
                    <div transition:fly={{ y: 10, duration: 300, delay: 100, easing: cubicOut }}>
                      <Label
                        class="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 has-aria-checked:border-destructive has-aria-checked:bg-destructive/20"
                      >
                        <Checkbox
                          id="delete-confirm-2"
                          bind:checked={deleteCheckbox2}
                          disabled={deleteAsyncState === "processing"}
                          class="data-[state=checked]:border-destructive data-[state=checked]:bg-destructive"
                        />
                        <div class="grid gap-1.5 font-normal">
                          <p class="text-sm leading-none font-medium">
                            I have backed up any important data
                          </p>
                          <p class="text-xs text-muted-foreground">
                            Ensure you've saved any information you need before proceeding.
                          </p>
                        </div>
                      </Label>
                    </div>
                  {/if}

                  {#if deleteCheckbox1 && deleteCheckbox2}
                    <div transition:fly={{ y: 10, duration: 300, delay: 100, easing: cubicOut }}>
                      <Label
                        class="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 has-aria-checked:border-destructive has-aria-checked:bg-destructive/20"
                      >
                        <Checkbox
                          id="delete-confirm-3"
                          bind:checked={deleteCheckbox3}
                          disabled={deleteAsyncState === "processing"}
                          class="data-[state=checked]:border-destructive data-[state=checked]:bg-destructive"
                        />
                        <div class="grid gap-1.5 font-normal">
                          <p class="text-sm leading-none font-medium">
                            I want to permanently delete my account
                          </p>
                          <p class="text-xs text-muted-foreground">
                            Final confirmation to proceed with account deletion.
                          </p>
                        </div>
                      </Label>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>

            <Separator />

            <div class="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onclick={(e) => {
                  const form = e.currentTarget.closest("form");
                  form?.reset();
                  deleteUser.fields.confirmEmail.set("");
                  deleteCheckbox1 = false;
                  deleteCheckbox2 = false;
                  deleteCheckbox3 = false;
                }}
                disabled={deleteAsyncState === "processing"}
              >
                Clear
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={!allConfirmed || deleteAsyncState === "processing"}
                class="min-w-32"
              >
                {#if deleteAsyncState === "processing"}
                  <Loader class="size-4 animate-spin" />
                  Deleting
                  {@render LoadingDots()}
                {:else}
                  <Trash2 class="size-4" />
                  Delete Account
                {/if}
              </Button>
            </div>
          </form>
        </div>
      </ScrollArea>
    </UnderlineTabs.Content>
  </UnderlineTabs.Root>
{/snippet}
