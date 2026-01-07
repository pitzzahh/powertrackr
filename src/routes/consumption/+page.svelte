<script lang="ts">
  import {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    showPromise,
    dismissToast,
  } from "$/components/toast";
  import { Button } from "$/components/ui/button";
  import * as Card from "$/components/ui/card";

  function handleLearnMore() {
    showInfo("More information", "This would navigate to documentation.");
  }

  async function simulateAsyncOperation() {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ success: true }), 3000);
    });
  }

  function handleLoadingToast() {
    const id = showLoading("Processing your request...", "This may take a few seconds");

    setTimeout(() => {
      dismissToast(id);
      showSuccess("Request completed!");
    }, 3000);
  }

  function handleLoadingToError() {
    const id = showLoading("Processing...", "Please wait");

    setTimeout(() => {
      dismissToast(id);
      showError("Request failed!");
    }, 2000);
  }

  function handlePromiseToast() {
    showPromise(simulateAsyncOperation(), {
      loading: {
        title: "Processing your request...",
        description: "Please wait while we process this",
      },
      success: {
        title: "Request completed successfully!",
        description: "Your operation was successful",
      },
      error: {
        title: "Failed to process request",
        description: "Something went wrong",
      },
    });
  }
</script>

<div class="container mx-auto max-w-6xl space-y-6 p-4">
  <div class="space-y-2">
    <h1 class="text-3xl font-bold tracking-tight">Consumption Page</h1>
    <p class="text-muted-foreground">Complex toast notification examples</p>
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <!-- Warning Toast with Action -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Warning with Action</Card.Title>
        <Card.Description>Shows a warning message with a "Learn more" button</Card.Description>
      </Card.Header>
      <Card.Content>
        <Button
          variant="outline"
          class="w-full"
          onclick={() =>
            showToast({
              title: "Something requires your action!",
              description:
                "It conveys that a specific action is needed to resolve or address a situation.",
              variant: "warning",
              action: {
                label: "Learn more",
                onClick: () => handleLearnMore(),
              },
            })}
        >
          Show Warning Toast
        </Button>
      </Card.Content>
    </Card.Root>

    <!-- Error Toast with Action -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Error with Action</Card.Title>
        <Card.Description>Shows an error message with a "Learn more" button</Card.Description>
      </Card.Header>
      <Card.Content>
        <Button
          variant="outline"
          class="w-full"
          onclick={() =>
            showToast({
              title: "We couldn't complete your request!",
              description:
                "It indicates that an issue has prevented the processing of the request.",
              variant: "error",
              action: {
                label: "Learn more",
                onClick: () => handleLearnMore(),
              },
            })}
        >
          Show Error Toast
        </Button>
      </Card.Content>
    </Card.Root>

    <!-- Success Toast with Action -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Success with Action</Card.Title>
        <Card.Description>Shows a success message with a "Learn more" button</Card.Description>
      </Card.Header>
      <Card.Content>
        <Button
          variant="outline"
          class="w-full"
          onclick={() =>
            showToast({
              title: "Your request was completed!",
              description: "It demonstrates that the task or request has been processed.",
              variant: "success",
              action: {
                label: "Learn more",
                onClick: () => handleLearnMore(),
              },
            })}
        >
          Show Success Toast
        </Button>
      </Card.Content>
    </Card.Root>

    <!-- Info Toast with Action -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Info with Action</Card.Title>
        <Card.Description>Shows an info message with a "Learn more" button</Card.Description>
      </Card.Header>
      <Card.Content>
        <Button
          variant="outline"
          class="w-full"
          onclick={() =>
            showToast({
              title: "Here is some helpful information!",
              description: "It aims to provide clarity or support for better decision-making.",
              variant: "info",
              action: {
                label: "Learn more",
                onClick: () => handleLearnMore(),
              },
            })}
        >
          Show Info Toast
        </Button>
      </Card.Content>
    </Card.Root>

    <!-- Update Available Toast -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Update Available</Card.Title>
        <Card.Description>Shows an update notification with action buttons</Card.Description>
      </Card.Header>
      <Card.Content>
        <Button
          variant="outline"
          class="w-full"
          onclick={() =>
            showToast({
              title: "Version 1.4 is now available!",
              description: "This update contains several bug fixes and performance improvements.",
              variant: "info",
              action: {
                label: "Install",
                onClick: () => showSuccess("Installing update..."),
              },
              cancel: {
                label: "Later",
              },
            })}
        >
          Show Update Toast
        </Button>
      </Card.Content>
    </Card.Root>

    <!-- Privacy Cookie Toast -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Cookie Consent</Card.Title>
        <Card.Description>Shows a privacy/cookie consent message</Card.Description>
      </Card.Header>
      <Card.Content>
        <Button
          variant="outline"
          class="w-full"
          onclick={() =>
            showToast({
              title: "We Value Your Privacy 🍪",
              description:
                "We use cookies to improve your experience, and show personalized content.",
              variant: "info",
              action: {
                label: "Accept",
                onClick: () => showSuccess("Preferences saved"),
              },
              cancel: {
                label: "Decline",
                onClick: () => showInfo("Preferences saved"),
              },
            })}
        >
          Show Cookie Toast
        </Button>
      </Card.Content>
    </Card.Root>

    <!-- Loading Toast Examples -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Loading Toast</Card.Title>
        <Card.Description>Shows a loading toast that updates to success</Card.Description>
      </Card.Header>
      <Card.Content>
        <Button variant="outline" class="w-full" onclick={handleLoadingToast}>
          Show Loading → Success
        </Button>
      </Card.Content>
    </Card.Root>

    <!-- Loading to Error -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Loading to Error</Card.Title>
        <Card.Description>Shows a loading toast that updates to error</Card.Description>
      </Card.Header>
      <Card.Content>
        <Button variant="outline" class="w-full" onclick={handleLoadingToError}>
          Show Loading → Error
        </Button>
      </Card.Content>
    </Card.Root>

    <!-- Promise Toast -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Promise Toast</Card.Title>
        <Card.Description>
          Automatically handles loading, success, and error states
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <Button variant="outline" class="w-full" onclick={handlePromiseToast}>
          Show Promise Toast
        </Button>
      </Card.Content>
    </Card.Root>

    <!-- Quick Examples -->
    <Card.Root class="md:col-span-2">
      <Card.Header>
        <Card.Title>Quick Toast Examples</Card.Title>
        <Card.Description>Simple toasts without descriptions</Card.Description>
      </Card.Header>
      <Card.Content class="flex flex-wrap gap-2">
        <Button
          size="sm"
          onclick={() => showSuccess("Success!", "Operation completed successfully")}
        >
          Success
        </Button>
        <Button size="sm" onclick={() => showError("Error!", "Something went wrong")}>Error</Button>
        <Button size="sm" onclick={() => showWarning("Warning!", "Please be careful")}>
          Warning
        </Button>
        <Button size="sm" onclick={() => showInfo("Info", "Helpful information")}>Info</Button>
      </Card.Content>
    </Card.Root>
  </div>
</div>
