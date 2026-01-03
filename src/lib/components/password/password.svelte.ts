import { Context, watch } from "runed";
import type { ReadableBoxedValues, WritableBoxedValues } from "svelte-toolbelt";
import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import type { Score } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";

const passwordOptions = {
  translations: zxcvbnEnPackage.translations,
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
};

zxcvbnOptions.setOptions(passwordOptions);

type PasswordRootStateProps = WritableBoxedValues<{
  hidden: boolean;
}> &
  ReadableBoxedValues<{
    minScore: number;
    enableStrengthCheck: boolean;
  }>;

type PasswordState = {
  value: string | number;
  toggleMounted: boolean;
  strengthMounted: boolean;
  tainted: boolean;
};

const defaultPasswordState: PasswordState = {
  value: "",
  toggleMounted: false,
  strengthMounted: false,
  tainted: false,
};

class PasswordRootState {
  passwordState = $state(defaultPasswordState);

  constructor(readonly opts: PasswordRootStateProps) {}

  // only re-run when the password changes
  strength = $derived.by(() =>
    this.opts.enableStrengthCheck.current
      ? zxcvbn(String(this.passwordState.value))
      : {
          password: "",
          score: 4 as Score,
          feedback: { warning: "", suggestions: [] },
          guesses: 0,
          guessesLog10: 0,
          calcTime: 0,
          crackTimesSeconds: {
            onlineThrottling100PerHour: 0,
            onlineNoThrottling10PerSecond: 0,
            offlineSlowHashing1e4PerSecond: 0,
            offlineFastHashing1e10PerSecond: 0,
          },
          crackTimesDisplay: {
            onlineThrottling100PerHour: "less than a second",
            onlineNoThrottling10PerSecond: "less than a second",
            offlineSlowHashing1e4PerSecond: "less than a second",
            offlineFastHashing1e10PerSecond: "less than a second",
          },
          sequence: [],
        },
  );
}

type PasswordInputStateProps = WritableBoxedValues<{
  value: string | number;
}> &
  ReadableBoxedValues<{
    ref: HTMLInputElement | null;
  }>;

class PasswordInputState {
  constructor(
    readonly root: PasswordRootState,
    readonly opts: PasswordInputStateProps,
  ) {
    watch(
      () => this.opts.value.current,
      () => {
        if (this.root.passwordState.value !== this.opts.value.current) {
          this.root.passwordState.tainted = true;
          this.root.passwordState.value = this.opts.value.current;
        }
      },
    );

    $effect(() => {
      if (!this.root.passwordState.strengthMounted) return;

      // if the password is empty, we let the `required` attribute handle the validation
      if (
        this.root.passwordState.value !== "" &&
        this.root.strength.score < this.root.opts.minScore.current &&
        this.root.opts.enableStrengthCheck.current
      ) {
        this.opts.ref.current?.setCustomValidity("Password is too weak");
      } else {
        this.opts.ref.current?.setCustomValidity("");
      }
    });
  }

  props = $derived.by(() => ({
    "aria-invalid":
      this.root.strength.score < this.root.opts.minScore.current &&
      this.root.passwordState.tainted &&
      this.root.passwordState.strengthMounted &&
      this.root.opts.enableStrengthCheck.current,
  }));
}

class PasswordToggleVisibilityState {
  constructor(readonly root: PasswordRootState) {
    this.root.passwordState.toggleMounted = true;

    // this way we go back to the correct padding when toggle is unmounted
    $effect(() => {
      return () => {
        this.root.passwordState.toggleMounted = false;
      };
    });
  }
}

class PasswordStrengthState {
  constructor(readonly root: PasswordRootState) {
    this.root.passwordState.strengthMounted = true;

    $effect(() => {
      return () => {
        this.root.passwordState.strengthMounted = false;
      };
    });
  }

  get strength() {
    return this.root.strength;
  }
}

const ctx = new Context<PasswordRootState>("password-root-state");

export function usePassword(props: PasswordRootStateProps) {
  return ctx.set(new PasswordRootState(props));
}

export function usePasswordInput(props: PasswordInputStateProps) {
  return new PasswordInputState(ctx.get(), props);
}

export function usePasswordToggleVisibility() {
  return new PasswordToggleVisibilityState(ctx.get());
}

export function usePasswordStrength() {
  return new PasswordStrengthState(ctx.get());
}
