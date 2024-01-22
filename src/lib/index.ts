import { writable } from "svelte/store";

const randomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const filteredDataFields = ["date", "totalKwh", "subKwh", "balance", "payment", "status"]

export const store = writable({
    filteredField: '',
    isLoggingOut: false,
    isLoggedIn: false
})