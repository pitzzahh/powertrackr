<script lang="ts" module>
  import type { HTMLInputAttributes } from "svelte/elements";

  export type PasswordComponentProps = Omit<HTMLInputAttributes, "type"> & {
    id: string;
    value?: string | number;
    showProgress?: boolean;
    showRequirements?: boolean;
  };
</script>

<script lang="ts">
  import { cn } from "#lib/utils/style.js";
  import { X, EyeOff, View, Check } from "#lib/assets/icons.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { usePasswordStrength } from "#lib/hooks/password-strength.svelte.js";

  let {
    id,
    value = $bindable(""),
    showProgress = true,
    showRequirements = true,
    class: className,
    type: _type,
    ...restProps
  }: PasswordComponentProps & { type?: string } = $props();

  const passwordStrength = $derived(usePasswordStrength({ id }));

  // Known keys of a remote-form `.as()` spread plus plain input attrs.
  // The runtime object keeps every caller prop; this contract names the
  // typed surface so the checker never sees the full 400-key spread.
  // `HTMLInputAttributes` resolves from the module script (the checker
  // merges both scopes; `import type` leaves no runtime binding).
  type ForwardedFieldProps = {
    name?: string;
    required?: boolean;
    autofocus?: boolean;
    autocomplete?: HTMLInputAttributes["autocomplete"];
    placeholder?: string;
    id?: string;
    disabled?: boolean;
    readonly?: boolean;
    minlength?: number;
    maxlength?: number;
    pattern?: string;
    min?: number | string;
    max?: number | string;
    step?: number | string;
    "aria-invalid"?: boolean | "true" | "false";
    "aria-describedby"?: string;
    files?: undefined;
  };
  const forwardedProps = $derived<ForwardedFieldProps>({
    ...restProps,
    files: undefined,
  } as ForwardedFieldProps);
</script>

<div class={cn("flex flex-col gap-2", className)}>
  <!-- Password input field with toggle visibility button -->
  <div class="relative">
    <Input
      id={passwordStrength.id}
      class="pe-9"
      placeholder="Password"
      type={passwordStrength.isVisible ? "text" : "password"}
      bind:value={passwordStrength.password}
      aria-describedby={passwordStrength.id}
      {...forwardedProps}
    />
    <button
      class="absolute inset-y-0 inset-e-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
      type="button"
      onclick={() => passwordStrength.toggleVisibility()}
      aria-label={passwordStrength.isVisible ? "Hide password" : "Show password"}
      aria-pressed={passwordStrength.isVisible}
      aria-controls={id}
    >
      {#if passwordStrength.isVisible}
        <EyeOff size={16} aria-hidden="true" />
      {:else}
        <View size={16} aria-hidden="true" />
      {/if}
    </button>
  </div>

  <!-- Password strength indicator -->
  {#if showProgress}
    <div
      class="h-1 w-full overflow-hidden rounded-full bg-border"
      role="progressbar"
      aria-valuenow={passwordStrength.strengthScore}
      aria-valuemin={0}
      aria-valuemax={4}
      aria-label="Password strength"
    >
      <div
        class={cn("h-full transition-all duration-500 ease-out", passwordStrength.strengthColor)}
        style:width="{(passwordStrength.strengthScore / 4) * 100}%"
      ></div>
    </div>
  {/if}

  <!-- Password requirements list -->
  {#if showRequirements}
    <ul class="space-y-1.5" aria-label="Password requirements">
      {#each passwordStrength.strength as req (req.text)}
        <li class="flex items-center space-x-2" tabindex="-1">
          {#if req.met}
            <Check size={16} class="text-emerald-500" aria-hidden="true" />
          {:else}
            <X size={16} class="text-muted-foreground/80" aria-hidden="true" />
          {/if}
          <span class={`text-xs ${req.met ? "text-emerald-600" : "text-muted-foreground"}`}>
            {req.text}
            <span class="sr-only">
              {req.met ? " - Requirement met" : " - Requirement not met"}
            </span>
          </span>
        </li>
      {/each}
    </ul>
  {/if}
</div>
