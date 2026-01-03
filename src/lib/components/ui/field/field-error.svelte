<script lang="ts">
    import { cn } from "$lib/utils/style.js";
    import type { HTMLAttributes } from "svelte/elements";
    import type { Snippet } from "svelte";
    import type { WithElementRef } from "$/index";

    let {
        ref = $bindable(null),
        class: className,
        children,
        errors,
        fieldName,
        value,
        ...restProps
    }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
        children?: Snippet;
        errors?: { message?: string }[];
        fieldName?: string;
        value?: unknown;
    } = $props();

    function transformMessage(message: string): string {
        if (message === "Invalid input: expected number, received undefined") {
            return "is required";
        }
        if (message === "Invalid input: expected number, received nan") {
            return "must be a valid number";
        }
        if (message === "Invalid input: expected string, received undefined") {
            return "is required";
        }
        // Add more mappings as needed
        return message;
    }

    function isEmpty(val: unknown): boolean {
        return (
            val == null || val === "" || (typeof val === "number" && isNaN(val))
        );
    }

    function isTypeError(message: string): boolean {
        return (
            message.includes("must be a number") ||
            message.includes("must be a valid number")
        );
    }

    const hasContent = $derived.by(() => {
        // has slotted error
        if (children) return true;

        // no errors
        if (!errors) return false;

        // has an error but no message
        if (errors.length === 1 && !errors[0]?.message) {
            return false;
        }

        // hide type errors for empty fields
        if (
            isEmpty(value) &&
            errors.some((e) => e.message && isTypeError(e.message))
        ) {
            return false;
        }

        return true;
    });

    const isMultipleErrors = $derived(errors && errors.length > 1);
    const singleErrorMessage = $derived(
        errors &&
            errors.length === 1 &&
            transformMessage(errors[0]?.message || ""),
    );
</script>

{#if hasContent}
    <div
        bind:this={ref}
        role="alert"
        data-slot="field-error"
        class={cn("text-destructive text-sm font-normal", className)}
        {...restProps}
    >
        {#if children}
            {@render children()}
        {:else if singleErrorMessage}
            {fieldName
                ? `${fieldName} ${singleErrorMessage}`
                : singleErrorMessage}
        {:else if isMultipleErrors}
            <ul class="ms-4 flex list-disc flex-col gap-1">
                {#each errors ?? [] as error, index (index)}
                    {#if error?.message}
                        <li>
                            {fieldName
                                ? `${fieldName}: ${transformMessage(error.message)}`
                                : transformMessage(error.message)}
                        </li>
                    {/if}
                {/each}
            </ul>
        {/if}
    </div>
{/if}
