/**
 * Toast Utilities for PowerTrackr
 *
 * Uses headless sonner with custom Toast component for consistent styling.
 *
 * @example
 * ```typescript
 * import { showSuccess, showError, showWarning, showInfo } from '$/components/toast';
 *
 * // Show success
 * showSuccess("Saved!", "Your changes have been saved.");
 *
 * // Show error
 * showError("Error", "Something went wrong.");
 *
 * // Show with action
 * showToast({
 *   title: "Update available",
 *   variant: "info",
 *   action: { label: "Install", onClick: () => handleInstall() }
 * });
 *
 * // Loading toast
 * const id = showLoading("Processing...");
 * // Update it later
 * dismissToast(id);
 * showSuccess("Done!");
 * ```
 */
import { toast as sonnerToast } from "svelte-sonner";
import ToastComponent from "./toast.svelte";

export type ToastVariant = "info" | "success" | "warning" | "error" | "loading";

export interface ShowToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick?: () => void;
  };
}

/**
 * Show a custom toast notification using our Toast component
 */
export function showToast(options: ShowToastOptions) {
  const { title, description, variant = "info", duration, action } = options;

  // If it's a loading toast, we need to handle it differently
  if (variant === "loading") {
    const id = sonnerToast.custom(ToastComponent, {
      duration: Infinity, // Loading toasts don't auto-dismiss
      componentProps: {
        title,
        description,
        variant: "info", // Use info style for loading
        dismissible: false, // No close button for loading
        isLoading: true,
      },
    });
    return id;
  }

  const id = sonnerToast.custom(ToastComponent, {
    duration,
    componentProps: {
      title,
      description,
      variant,
      dismissible: true,
      action,
      onDismiss: () => {
        sonnerToast.dismiss(id);
      },
    },
  });
  return id;
}

/**
 * Show a success toast
 */
export function showSuccess(title: string, description?: string, duration?: number) {
  return showToast({ title, description, variant: "success", duration });
}

/**
 * Show an error toast
 */
export function showError(title: string, description?: string, duration?: number) {
  return showToast({ title, description, variant: "error", duration });
}

/**
 * Show a warning toast
 */
export function showWarning(title: string, description?: string, duration?: number) {
  return showToast({ title, description, variant: "warning", duration });
}

/**
 * Show an info toast
 */
export function showInfo(title: string, description?: string, duration?: number) {
  return showToast({ title, description, variant: "info", duration });
}

/**
 * Show a loading toast
 */
export function showLoading(title: string, description?: string) {
  return showToast({ title, description, variant: "loading" });
}

/**
 * Show a promise toast that automatically handles loading, success, and error states
 */
export function showPromise<T>(
  promise: Promise<T>,
  options: {
    loading: { title: string; description?: string };
    success:
      | { title: string; description?: string }
      | ((data: T) => { title: string; description?: string });
    error:
      | { title: string; description?: string }
      | ((error: unknown) => { title: string; description?: string });
    onSuccess?: (data: T) => void; // Optional callback for success
    onError?: (error: string) => void; // Optional callback for error
  }
) {
  const loadingId = showLoading(options.loading.title, options.loading.description);

  promise
    .then((data) => {
      const successOptions =
        typeof options.success === "function" ? options.success(data) : options.success;
      dismissToast(loadingId);
      showSuccess(successOptions.title, successOptions.description);
      if (options.onSuccess) options.onSuccess(data); // Call optional callback
    })
    .catch((error) => {
      const errorOptions =
        typeof options.error === "function" ? options.error(error) : options.error;
      dismissToast(loadingId);
      showError(errorOptions.title, errorOptions.description);
      if (options.onError) options.onError(errorOptions?.description || "Something went wrong"); // Call optional callback
    });

  return loadingId; // Still returns the ID, but now with optional callbacks
}

/**
 * Dismiss a specific toast
 */
export function dismissToast(toastId?: string | number) {
  sonnerToast.dismiss(toastId);
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts() {
  sonnerToast.dismiss();
}

// Export the raw toast object for advanced usage
export const toast = sonnerToast;
