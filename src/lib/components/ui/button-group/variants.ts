import { tv, type VariantProps } from "tailwind-variants";

// Segments share edges: inner corners square off and the doubled border between them drops.
export const buttonGroup = tv({
	slots: {
		root: "group/button-group flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
		text: "flex items-center gap-2 rounded-lg border bg-muted px-3 font-medium text-sm [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
		separator:
			"relative self-stretch bg-border data-[orientation=horizontal]:mx-px data-[orientation=horizontal]:w-auto data-[orientation=vertical]:my-px data-[orientation=vertical]:h-auto",
	},
	variants: {
		orientation: {
			horizontal: {
				root: "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
			},
			vertical: {
				root: "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
			},
		},
	},
	defaultVariants: { orientation: "horizontal" },
});

export type ButtonGroupOrientation = NonNullable<
	VariantProps<typeof buttonGroup>["orientation"]
>;
