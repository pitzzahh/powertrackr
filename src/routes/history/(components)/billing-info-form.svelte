<script lang="ts" module>
    export type BillingInfoFormProps = {
        action: "add" | "update";
        app_state?: "stale" | "processing";
        billingInfo?: BillingInfo;
        /**
         * Callback to be called when the form is submitted.
         * This can be used to reset the form or perform other actions.
         */
        callback?: () => void;
    };
</script>

<script lang="ts">
    // Field Components
    import * as Field from "$/components/ui/field";
    // UI Components
    import { Button } from "$/components/ui/button";
    import { Input } from "$/components/ui/input";
    import * as Popover from "$/components/ui/popover";
    import {
        CalendarDate,
        getLocalTimeZone,
        today,
    } from "@internationalized/date";
    import {
        createBillingInfo,
        updateBillingInfo,
    } from "$/remotes/billing-info.remote";
    import { Label } from "$/components/ui/label";
    import { ChevronDown } from "$/assets/icons";
    import { Calendar } from "$/components/ui/calendar";
    import * as Card from "$/components/ui/card/index.js";
    import type { BillingInfo } from "$/types/billing-info";
    import { formatDate } from "$/utils/format";

    let {
        action,
        app_state = $bindable("stale"),
        billingInfo,
        callback,
    }: BillingInfoFormProps = $props();

    const identity = $props.id();

    let {
        open,
        todayDate,
        dateValue,
    }: {
        open: boolean;
        todayDate: CalendarDate;
        dateValue: CalendarDate | undefined;
    } = $derived({
        open: false,
        todayDate: today(getLocalTimeZone()),
        dateValue: (() => {
            if (action == "add" || !billingInfo) return undefined; // do not set a date for new entries
            const date = new Date(billingInfo.date);
            return new CalendarDate(
                date.getFullYear(),
                date.getMonth() + 1,
                date.getDate(),
            );
        })(),
    });

    let currentAction = $derived(
        action === "add" ? createBillingInfo : updateBillingInfo,
    );
</script>

<form {...currentAction} onsubmit={callback} class="space-y-4">
    {#if action === "update" && billingInfo}
        <input type="hidden" name="id" value={billingInfo.id} />
    {/if}
    <Field.Group>
        <Field.Field>
            <Label for="{identity}-date" class="px-1">Date</Label>
            <Popover.Root bind:open>
                <Popover.Trigger id="{identity}-date">
                    {#snippet child({ props })}
                        <Button
                            {...props}
                            variant="outline"
                            class="w-full sm:w-48 justify-between font-normal"
                        >
                            {dateValue
                                ? formatDate(
                                      dateValue.toDate(getLocalTimeZone()),
                                  )
                                : "Select date"}
                            <ChevronDown />
                        </Button>
                    {/snippet}
                </Popover.Trigger>
                <Popover.Content
                    class="w-auto overflow-hidden p-0"
                    align="start"
                >
                    <Card.Root class="max-w-75 py-4">
                        <Card.Content class="px-4">
                            <Calendar
                                type="single"
                                bind:value={dateValue}
                                captionLayout="dropdown"
                                onValueChange={() => {
                                    open = false;
                                }}
                                class="bg-transparent p-0 [--cell-size:--spacing(9.5)]"
                            />
                        </Card.Content>
                        <Card.Footer
                            class="flex flex-wrap gap-2 border-t px-4 pt-4!"
                        >
                            {#each [{ label: "Today", value: 0 }, { label: "Tomorrow", value: 1 }, { label: "In 3 days", value: 3 }, { label: "In a week", value: 7 }, { label: "In 2 weeks", value: 14 }] as preset (preset.value)}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    class="flex-1"
                                    onclick={() => {
                                        dateValue = todayDate?.add({
                                            days: preset.value,
                                        });
                                    }}
                                >
                                    {preset.label}
                                </Button>
                            {/each}
                        </Card.Footer>
                    </Card.Root>
                </Popover.Content>
            </Popover.Root>
            <input
                type="hidden"
                name="date"
                value={dateValue?.toString() || ""}
            />
            <Field.Description>Pick date</Field.Description>
        </Field.Field>
        <Field.Field>
            <Field.Label for="{identity}-balance">Current Balance</Field.Label>
            <Input
                type="number"
                step="0.01"
                id="{identity}-balance"
                name="balance"
                placeholder="Enter value"
                value={action === "update" && billingInfo
                    ? billingInfo.balance.toString()
                    : ""}
            />
            <Field.Description>Enter balance</Field.Description>
        </Field.Field>
        <Field.Field>
            <Field.Label for="{identity}-totalKwh">Total KWh</Field.Label>
            <Input
                type="number"
                id="{identity}-totalKwh"
                name="totalKwh"
                placeholder="Enter value"
                value={action === "update" && billingInfo
                    ? billingInfo.totalKwh.toString()
                    : ""}
            />
            <Field.Description>Enter total KWh</Field.Description>
        </Field.Field>
        <Field.Field>
            <Field.Label for="{identity}-subKwh">Sub KWh</Field.Label>
            <Input
                type="number"
                id="{identity}-subKwh"
                name="subKwh"
                placeholder="Enter value"
                value={action === "update" && billingInfo
                    ? (billingInfo.subKwh?.toString() ?? "")
                    : ""}
            />
            <Field.Description>Enter sub KWh</Field.Description>
        </Field.Field>
        <Field.Field>
            <Field.Label for="{identity}-status">Status</Field.Label>
            <select
                id="{identity}-status"
                name="status"
                value={action === "update" && billingInfo
                    ? billingInfo.status
                    : "pending"}
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
            </select>
            <Field.Description>Select status</Field.Description>
        </Field.Field>
        <Field.Field>
            <Field.Label for="{identity}-payPerKwh">Pay Per KWh</Field.Label>
            <Input
                type="number"
                step="0.01"
                id="{identity}-payPerKwh"
                name="payPerKwh"
                placeholder="Enter value"
                value={action === "update" && billingInfo
                    ? billingInfo.payPerKwh.toString()
                    : ""}
            />
            <Field.Description>Enter pay per KWh</Field.Description>
        </Field.Field>
        <Field.Field>
            <Field.Label for="{identity}-subReadingLatest"
                >Sub Reading Latest</Field.Label
            >
            <Input
                type="number"
                id="{identity}-subReadingLatest"
                name="subReadingLatest"
                placeholder="Enter value"
                value={action === "update" && billingInfo
                    ? (billingInfo.subReadingLatest?.toString() ?? "")
                    : ""}
            />
            <Field.Description>Enter sub reading latest</Field.Description>
        </Field.Field>
        <Field.Field>
            <Field.Label for="{identity}-subReadingOld"
                >Sub Reading Old</Field.Label
            >
            <Input
                type="number"
                id="{identity}-subReadingOld"
                name="subReadingOld"
                placeholder="Enter value"
                value={action === "update" && billingInfo
                    ? (billingInfo.subReadingOld?.toString() ?? "")
                    : ""}
            />
            <Field.Description>Enter sub reading old</Field.Description>
        </Field.Field>
        <Field.Field>
            <Field.Label for="{identity}-paymentId">Payment ID</Field.Label>
            <Input
                type="text"
                id="{identity}-paymentId"
                name="paymentId"
                placeholder="Enter payment ID"
                value={action === "update" && billingInfo
                    ? (billingInfo.paymentId ?? "")
                    : ""}
            />
            <Field.Description>Enter payment ID (optional)</Field.Description>
        </Field.Field>
        <Field.Field>
            <Field.Label for="{identity}-subPaymentId"
                >Sub Payment ID</Field.Label
            >
            <Input
                type="text"
                id="{identity}-subPaymentId"
                name="subPaymentId"
                placeholder="Enter sub payment ID"
                value={action === "update" && billingInfo
                    ? (billingInfo.subPaymentId ?? "")
                    : ""}
            />
            <Field.Description
                >Enter sub payment ID (optional)</Field.Description
            >
        </Field.Field>
    </Field.Group>

    <Button class="w-full" type="submit">Submit</Button>
</form>
