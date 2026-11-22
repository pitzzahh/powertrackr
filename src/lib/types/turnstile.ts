export interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  theme?: "auto" | "light" | "dark";
  /**
   * `normal` (300px, default) | `compact` (150px) | `flexible` (expands to
   * fill the container width — not supported with `appearance: "interaction-only"`).
   */
  size?: "normal" | "compact" | "flexible";
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
