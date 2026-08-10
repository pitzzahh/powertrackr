export interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  theme?: "auto" | "light" | "dark";
  /** Prevent the widget from injecting its own `<input name="cf-turnstile-response">` into the form. */
  "response-field"?: boolean;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
}

export interface TurnstileApi {
  render(container: HTMLElement, options: TurnstileRenderOptions): string;
  reset(widgetId: string | HTMLElement): void;
  remove(widgetId: string | HTMLElement): void;
}

const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Loads the Turnstile script once. Resolves whether the script loaded or not:
 * verification is enforced server-side, so a blocked widget simply fails closed
 * with a friendly security-check error on submit.
 */
export function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined" || window.turnstile) return Promise.resolve();
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}
