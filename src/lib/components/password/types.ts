import type {
  WithChildren,
  WithoutChildren,
  Meter as MeterPrimitive,
  Toggle as TogglePrimitive,
} from "bits-ui";
import type { HTMLAttributes, HTMLInputAttributes } from "svelte/elements";
import type { ZxcvbnResult } from "@zxcvbn-ts/core";

export type PasswordRootPropsWithoutHTML = WithChildren<{
  ref?: HTMLDivElement | null;
  hidden?: boolean;
  /** The minimum acceptable score for a password. (0-4)
   *
   * @default 3
   */
  minScore?: 0 | 1 | 2 | 3 | 4;
  /** Whether to enable password strength checking and validation.
   *
   * @default true
   */
  enableStrengthCheck?: boolean;
}>;

export type PasswordRootProps = WithoutChildren<HTMLAttributes<HTMLDivElement>> &
  PasswordRootPropsWithoutHTML;

export type PasswordInputPropsWithoutHTML = WithChildren<{
  ref?: HTMLInputElement | null;
  value?: string | number;
}>;

export type PasswordInputProps = Omit<
  WithoutChildren<HTMLInputAttributes>,
  "type" | "files" | "aria-invalid" | "value"
> &
  PasswordInputPropsWithoutHTML;

export type PasswordToggleVisibilityProps = Omit<
  TogglePrimitive.RootProps,
  "children" | "pressed" | "aria-label" | "tabindex"
>;

export type PasswordStrengthPropsWithoutHTML = {
  strength?: ZxcvbnResult;
};

export type PasswordStrengthProps = PasswordStrengthPropsWithoutHTML &
  WithoutChildren<MeterPrimitive.RootProps>;
