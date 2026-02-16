<script lang="ts" module>
  import type { Snippet } from "svelte";

  export type AccountSettingsProps = {
    user: App.Locals["user"];
    trigger?: Snippet<[]>;
    openAccountSettings: boolean;
  };

  type OverviewFormState = {
    name: string;
    email: string;
    image: string;
    emailVerified: boolean;
    registeredTwoFactor: boolean;
    asyncState: AsyncState;
  };

  type PasswordFormState = {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    asyncState: AsyncState;
  };

  type DeleteAccountFormState = {
    confirmEmail: string;
    asyncState: AsyncState;
  };
</script>

<script lang="ts">
  import * as Drawer from "$/components/ui/drawer/index.js";
  import { buttonVariants } from "$/components/ui/button/index.js";
  import { MediaQuery } from "svelte/reactivity";
  import * as Dialog from "$/components/ui/dialog";
  import { Portal } from "bits-ui";
  import * as UnderlineTabs from "$/components/underline-tabs";
  import * as Field from "$/components/ui/field/index.js";
  import { Input } from "$/components/ui/input/index.js";
  import { Button } from "$/components/ui/button/index.js";
  import { Separator } from "$/components/ui/separator/index.js";
  import { ScrollArea } from "$/components/ui/scroll-area";
  import { Loader, Check, CircleAlert, Lock, User, Trash2 } from "$lib/assets/icons.js";
  import { Badge } from "$/components/ui/badge";
  import { toast } from "svelte-sonner";
  import { scale } from "svelte/transition";
  import { sineInOut } from "svelte/easing";
  import type { AsyncState } from "$/types/state";
  import { WarningBanner, LoadingDots } from "$/components/snippets.svelte";
  import { showError, showInspectorWarning, showLoading, showSuccess } from "$/components/toast";

  let { user, trigger, openAccountSettings = $bindable(false) }: AccountSettingsProps = $props();

  const isDesktop = new MediaQuery("(min-width: 768px)");

  // Tab state
  let activeTab = $state<"overview" | "change-password" | "delete-account">("overview");

  // Overview form state
  let overviewForm = $derived<OverviewFormState>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    image: user?.image ?? "",
    emailVerified: user?.emailVerified ?? false,
    registeredTwoFactor: user?.registeredTwoFactor ?? false,
    asyncState: "idle",
  });

  // Password form state
  let passwordForm = $state<PasswordFormState>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    asyncState: "idle",
  });

  // Delete account form state
  let deleteAccountForm = $state<DeleteAccountFormState>({
    confirmEmail: "",
    asyncState: "idle",
  });

  // Form validation
  let overviewValid = $derived.by(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      overviewForm.name.trim().length > 0 &&
      overviewForm.email.trim().length > 0 &&
      emailRegex.test(overviewForm.email.trim())
    );
  });

  let passwordValid = $derived.by(() => {
    return (
      passwordForm.currentPassword.trim().length > 0 &&
      passwordForm.newPassword.trim().length >= 8 &&
      passwordForm.newPassword === passwordForm.confirmPassword &&
      passwordForm.currentPassword !== passwordForm.newPassword
    );
  });

  let passwordErrors = $derived.by(() => {
    const errors: string[] = [];
    if (passwordForm.newPassword.length > 0 && passwordForm.newPassword.length < 8) {
      errors.push("Password must be at least 8 characters");
    }
    if (
      passwordForm.newPassword.length > 0 &&
      passwordForm.confirmPassword.length > 0 &&
      passwordForm.newPassword !== passwordForm.confirmPassword
    ) {
      errors.push("Passwords do not match");
    }
    if (
      passwordForm.currentPassword.length > 0 &&
      passwordForm.newPassword.length > 0 &&
      passwordForm.currentPassword === passwordForm.newPassword
    ) {
      errors.push("New password must be different from current password");
    }
    return errors;
  });

  // Handle overview form submission
  async function handleOverviewSubmit(e: Event) {
    e.preventDefault();
    if (!overviewValid) return;

    overviewForm.asyncState = "processing";
    const toastId = toast.loading("Updating profile...");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In real app, make API call here
      // const response = await fetch('/api/profile', {
      //   method: 'PATCH',
      //   body: JSON.stringify({ name: overviewForm.name, email: overviewForm.email, image: overviewForm.image })
      // });

      overviewForm.asyncState = "success";
      toast.success("Profile updated successfully", { id: toastId });

      setTimeout(() => {
        overviewForm.asyncState = "idle";
      }, 2000);
    } catch (error) {
      overviewForm.asyncState = "error";
      toast.error("Failed to update profile. Please try again.", { id: toastId });

      setTimeout(() => {
        overviewForm.asyncState = "idle";
      }, 2000);
    }
  }

  // Handle password form submission
  async function handlePasswordSubmit(e: Event) {
    e.preventDefault();
    if (!passwordValid) return;

    passwordForm.asyncState = "processing";
    const toastId = toast.loading("Changing password...");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In real app, make API call here
      // const response = await fetch('/api/profile/password', {
      //   method: 'POST',
      //   body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword })
      // });

      passwordForm.asyncState = "success";
      toast.success("Password changed successfully", { id: toastId });

      // Clear password fields
      passwordForm.currentPassword = "";
      passwordForm.newPassword = "";
      passwordForm.confirmPassword = "";

      setTimeout(() => {
        passwordForm.asyncState = "idle";
      }, 2000);
    } catch (error) {
      passwordForm.asyncState = "error";
      toast.error("Failed to change password. Please try again.", { id: toastId });

      setTimeout(() => {
        passwordForm.asyncState = "idle";
      }, 2000);
    }
  }

  function clearPasswordForm() {
    passwordForm.currentPassword = "";
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";
  }

  // Handle account deletion
  async function handleDeleteAccount() {
    if (deleteAccountForm.confirmEmail !== overviewForm.email) {
      return showInspectorWarning();
    }

    deleteAccountForm.asyncState = "processing";
    const toastId = showLoading("Deleting account...");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In real app, make API call here
      // const response = await fetch('/api/account', {
      //   method: 'DELETE'
      // });

      deleteAccountForm.asyncState = "success";
      showSuccess("Account deleted successfully", undefined, undefined, {
        id: toastId,
      });
      // Close dialog and redirect or logout
      setTimeout(() => {
        openAccountSettings = false;
        deleteAccountForm.asyncState = "idle";
        // In real app: redirect to login or logout
      }, 1000);
    } catch (error) {
      deleteAccountForm.asyncState = "error";
      showError("Failed to delete account. Please try again.", undefined, undefined, {
        id: toastId,
      });
      setTimeout(() => {
        deleteAccountForm.asyncState = "idle";
      }, 2000);
    }
  }
</script>

{#if isDesktop.current}
  <Dialog.Root bind:open={openAccountSettings}>
    {#if trigger}
      <Dialog.Trigger>
        {@render trigger?.()}
      </Dialog.Trigger>
    {/if}
    <Portal>
      <Dialog.Content class="md:max-h-132.5 md:max-w-237.5 lg:max-w-250">
        <Dialog.Header>
          <Dialog.Title>Account Settings</Dialog.Title>
          <Dialog.Description>
            Manage your account settings and preferences. Changes are saved automatically.
          </Dialog.Description>
        </Dialog.Header>
        {@render content()}
      </Dialog.Content>
    </Portal>
  </Dialog.Root>
{:else}
  <Drawer.Root bind:open={openAccountSettings}>
    {#if trigger}
      <Drawer.Trigger>
        {@render trigger?.()}
      </Drawer.Trigger>
    {/if}
    <Portal>
      <Drawer.Content>
        <Drawer.Header class="text-start">
          <Drawer.Title>Account Settings</Drawer.Title>
          <Drawer.Description>
            Manage your account settings and preferences. Changes are saved automatically.
          </Drawer.Description>
        </Drawer.Header>
        {@render content()}
        <Drawer.Footer class="pt-2">
          <Drawer.Close class={buttonVariants({ variant: "outline" })}>Close</Drawer.Close>
        </Drawer.Footer>
      </Drawer.Content>
    </Portal>
  </Drawer.Root>
{/if}

{#snippet content()}
  <UnderlineTabs.Root bind:value={activeTab}>
    <UnderlineTabs.List>
      <UnderlineTabs.Trigger value="overview">Overview</UnderlineTabs.Trigger>
      <UnderlineTabs.Trigger value="change-password">Change Password</UnderlineTabs.Trigger>
      <UnderlineTabs.Trigger value="delete-account">Delete Account</UnderlineTabs.Trigger>
    </UnderlineTabs.List>

    <UnderlineTabs.Content value="overview">
      <ScrollArea orientation="vertical" class="h-80 rounded-md md:max-h-[60vh]">
        <div class="p-4">
          <form onsubmit={handleOverviewSubmit} class="space-y-6">
            <div class="space-y-4">
              <h4 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                Profile Information
              </h4>

              <Field.Group>
                <Field.Field>
                  <Field.Label for="account-name" class="px-1">Full Name</Field.Label>
                  <Input
                    id="account-name"
                    type="text"
                    bind:value={overviewForm.name}
                    placeholder="Enter your full name"
                    disabled={overviewForm.asyncState === "processing"}
                    class="w-full"
                  />
                  <Field.Description>This is your public display name.</Field.Description>
                </Field.Field>

                <Field.Field>
                  <Field.Label for="account-email" class="px-1">Email Address</Field.Label>
                  <Input
                    id="account-email"
                    type="email"
                    bind:value={overviewForm.email}
                    placeholder="Enter your email"
                    disabled={overviewForm.asyncState === "processing"}
                    class="w-full"
                  />
                  <Field.Description>
                    Your email address is used for notifications and account recovery.
                  </Field.Description>
                </Field.Field>

                <Field.Field>
                  <Field.Label for="account-image" class="px-1">
                    Profile Image <span class="text-muted-foreground">(Optional)</span>
                  </Field.Label>
                  <Input
                    id="account-image"
                    type="url"
                    bind:value={overviewForm.image}
                    placeholder="https://example.com/avatar.jpg"
                    disabled={overviewForm.asyncState === "processing"}
                    class="w-full"
                  />
                  <Field.Description>
                    Enter a URL to your profile image or avatar.
                  </Field.Description>
                </Field.Field>
              </Field.Group>
            </div>

            <Separator />

            <div class="space-y-4">
              <h4 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                Account Status
              </h4>

              <div class="grid gap-4 md:grid-cols-2">
                <div class="flex items-center justify-between rounded-lg border p-4">
                  <div class="space-y-0.5">
                    <div class="text-sm font-medium">Email Verification</div>
                    <div class="text-xs text-muted-foreground">
                      {overviewForm.emailVerified ? "Your email is verified" : "Email not verified"}
                    </div>
                  </div>
                  <Badge
                    class={[
                      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                      {
                        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400":
                          overviewForm.emailVerified,
                      },
                    ]}
                  >
                    {overviewForm.emailVerified ? "Verified" : "Pending"}
                  </Badge>
                </div>

                <div class="flex items-center justify-between rounded-lg border p-4">
                  <div class="space-y-0.5">
                    <div class="text-sm font-medium">Two-Factor Authentication</div>
                    <div class="text-xs text-muted-foreground">
                      {overviewForm.registeredTwoFactor ? "2FA is enabled" : "2FA not enabled"}
                    </div>
                  </div>
                  <Badge
                    class={[
                      "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
                      {
                        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400":
                          overviewForm.registeredTwoFactor,
                      },
                    ]}
                  >
                    {overviewForm.registeredTwoFactor ? "Enabled" : "Disabled"}
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
                disabled={overviewForm.asyncState === "processing"}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!overviewValid || overviewForm.asyncState === "processing"}
                class="min-w-32"
              >
                {#if overviewForm.asyncState === "processing"}
                  <Loader class="size-4 animate-spin" />
                  Saving...
                {:else if overviewForm.asyncState === "success"}
                  <Check class="size-4" />
                  Saved!
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

    <UnderlineTabs.Content value="change-password">
      <ScrollArea orientation="vertical" class="h-80 rounded-md md:max-h-[60vh]">
        <div class="p-4">
          <form onsubmit={handlePasswordSubmit} class="space-y-6">
            <div class="space-y-4">
              <h4 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                Change Password
              </h4>

              <Field.Group>
                <Field.Field>
                  <Field.Label for="current-password" class="px-1">Current Password</Field.Label>
                  <Input
                    id="current-password"
                    type="password"
                    bind:value={passwordForm.currentPassword}
                    placeholder="Enter current password"
                    disabled={passwordForm.asyncState === "processing"}
                    class="w-full"
                    autocomplete="current-password"
                  />
                  <Field.Description>
                    Enter your current password to verify your identity.
                  </Field.Description>
                </Field.Field>

                <Field.Field>
                  <Field.Label for="new-password" class="px-1">New Password</Field.Label>
                  <Input
                    id="new-password"
                    type="password"
                    bind:value={passwordForm.newPassword}
                    placeholder="Enter new password"
                    disabled={passwordForm.asyncState === "processing"}
                    class="w-full"
                    autocomplete="new-password"
                  />
                  <Field.Description>Password must be at least 8 characters long.</Field.Description
                  >
                </Field.Field>

                <Field.Field>
                  <Field.Label for="confirm-password" class="px-1">Confirm New Password</Field.Label
                  >
                  <Input
                    id="confirm-password"
                    type="password"
                    bind:value={passwordForm.confirmPassword}
                    placeholder="Confirm new password"
                    disabled={passwordForm.asyncState === "processing"}
                    class="w-full"
                    autocomplete="new-password"
                  />
                  <Field.Description>Re-enter your new password to confirm.</Field.Description>
                </Field.Field>
              </Field.Group>

              {#if passwordErrors.length > 0}
                <div
                  class="rounded-lg border border-destructive/50 bg-destructive/10 p-4"
                  in:scale={{ duration: 200, easing: sineInOut }}
                >
                  <div class="flex items-start gap-3">
                    <CircleAlert class="size-5 text-destructive" />
                    <div class="flex-1 space-y-1">
                      <p class="text-sm font-medium text-destructive">
                        Please fix the following errors:
                      </p>
                      <ul class="list-inside list-disc space-y-1 text-sm text-destructive/90">
                        {#each passwordErrors as error (error)}
                          <li>{error}</li>
                        {/each}
                      </ul>
                    </div>
                  </div>
                </div>
              {/if}
            </div>

            <Separator />

            <div class="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onclick={clearPasswordForm}
                disabled={passwordForm.asyncState === "processing"}
              >
                Clear
              </Button>
              <Button
                type="submit"
                disabled={!passwordValid || passwordForm.asyncState === "processing"}
                class="min-w-32"
              >
                {#if passwordForm.asyncState === "processing"}
                  <Loader class="size-4 animate-spin" />
                  Changing...
                {:else if passwordForm.asyncState === "success"}
                  <Check class="size-4" />
                  Changed!
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

    <UnderlineTabs.Content value="delete-account">
      <ScrollArea orientation="vertical" class="h-80 rounded-md md:max-h-[60vh]">
        <div class="p-4">
          <div class="space-y-6">
            <div class="space-y-4">
              <h4 class="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                Danger Zone
              </h4>

              {@render WarningBanner({
                message:
                  "This action cannot be undone. This will permanently delete your account and remove all your data from our servers.",
              })}

              <div class="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
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

              <div class="space-y-2">
                <Field.Label for="delete-confirm-email" class="px-1">
                  Type your email to confirm:
                  <span class="font-mono text-primary">{overviewForm.email}</span>
                </Field.Label>
                <Input
                  id="delete-confirm-email"
                  type="email"
                  bind:value={deleteAccountForm.confirmEmail}
                  placeholder={overviewForm.email}
                  disabled={deleteAccountForm.asyncState === "processing"}
                  class="w-full text-center"
                  autocomplete="off"
                />
                <Field.Description>
                  Enter your email address exactly as shown above to confirm deletion.
                </Field.Description>
              </div>
            </div>

            <Separator />

            <div class="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onclick={() => {
                  deleteAccountForm.confirmEmail = "";
                }}
                disabled={deleteAccountForm.asyncState === "processing"}
              >
                Clear
              </Button>
              <Button
                type="button"
                variant="destructive"
                onclick={handleDeleteAccount}
                disabled={deleteAccountForm.confirmEmail !== overviewForm.email ||
                  deleteAccountForm.asyncState === "processing"}
                class="min-w-32"
              >
                {#if deleteAccountForm.asyncState === "processing"}
                  <Loader class="size-4 animate-spin" />
                  Deleting
                  {@render LoadingDots()}
                {:else if deleteAccountForm.asyncState === "success"}
                  <Check class="size-4" />
                  Deleted!
                {:else}
                  <Trash2 class="size-4" />
                  Delete Account
                {/if}
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </UnderlineTabs.Content>
  </UnderlineTabs.Root>
{/snippet}
