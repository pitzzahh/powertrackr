import { tv, type VariantProps } from "tailwind-variants";

/** Separate filled slots; the active one takes the focus ring, a typed digit rises in. */
export const inputOtp = tv({
	slots: {
		root: "flex items-center gap-2 has-disabled:opacity-50",
		input: "disabled:cursor-not-allowed",
		group: "flex items-center gap-2",
		slot: [
			"relative flex items-center justify-center border border-input bg-(--field) font-medium tabular-nums",
			"outline-none transition-[box-shadow,border-color] duration-(--duration-fast) ease-[var(--ease-smooth)]",
			"data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-3 data-[active=true]:ring-ring/20",
			"aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20",
			"motion-reduce:transition-none",
		],
		value: "otp-value",
		caret: "pointer-events-none absolute inset-0 flex items-center justify-center",
		caretLine: "otp-caret h-4 w-px bg-foreground",
		separator: "flex items-center text-muted-foreground [&_svg]:size-4",
	},
	variants: {
		size: {
			// Square slots on the control ladder, so a code field lines up with the button beside it.
			xs: { slot: "size-6 rounded-sm text-xs", root: "gap-1", group: "gap-1" },
			sm: { slot: "size-8 rounded-md text-sm", root: "gap-1.5", group: "gap-1.5" },
			default: { slot: "size-9 rounded-lg text-base" },
			lg: { slot: "size-10 rounded-lg text-lg" },
			xl: { slot: "size-12 rounded-xl text-xl", root: "gap-2.5", group: "gap-2.5" },
		},
		invalid: {
			true: {
				slot: "border-destructive data-[active=true]:border-destructive data-[active=true]:ring-destructive/20",
			},
			false: {},
		},
		/** Plays once each time `invalid` turns on. */
		invalidMotion: { shake: {}, pulse: {}, none: {} },
	},
	compoundVariants: [
		{
			invalid: true,
			invalidMotion: "shake",
			class: {
				root: "animate-[otp-shake_400ms_var(--ease-ui-out)] motion-reduce:animate-none",
			},
		},
		{
			invalid: true,
			invalidMotion: "pulse",
			class: {
				slot: "animate-[otp-pulse_360ms_var(--ease-ui-out)] motion-reduce:animate-none",
			},
		},
	],
	defaultVariants: { size: "default", invalid: false, invalidMotion: "shake" },
});

export type InputOtpSize = NonNullable<VariantProps<typeof inputOtp>["size"]>;
export type InputOtpInvalidMotion = NonNullable<
	VariantProps<typeof inputOtp>["invalidMotion"]
>;
