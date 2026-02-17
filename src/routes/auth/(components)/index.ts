export { default as AuthForm } from "./auth-form.svelte";
export { default as ForgotPasswordForm } from "./forgot-password-form.svelte";
export { default as ResetPasswordForm } from "./reset-password-form.svelte";
export { default as Setup2FAForm } from "./setup-2fa-form.svelte";
export { default as Checkpoint2FAForm } from "./checkpoint-2fa.svelte";
export { default as VerifyEmailForm } from "./verify-email-form.svelte";
export { default as AuthBackground } from "./auth-background.svelte";

export type AuthAction =
  | "login"
  | "register"
  | "verify-email"
  | "2fa-setup"
  | "2fa-checkpoint"
  | "reset-password"
  | "forgot-password";
