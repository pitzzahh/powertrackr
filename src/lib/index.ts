import { writable } from "svelte/store";
import cryptoRandomString from 'crypto-random-string';

/**
 * Generates sample billing data.
 * @param {number} count - The number of billing entries to generate.
 * @returns {BillingInfoPreview[]} - An array of generated billing information.
 */
export const generateSampleData = (count: number) => {
    const sampleData: BillingInfoPreview[] = [];

    for (let i = 1; i <= count; i++) {
        const billingEntry: BillingInfoPreview = {
            id: cryptoRandomString({ length: 10 }),
            date: formatDate(randomDate(new Date(2020, 0, 1), new Date())),
            totalKwh: Math.floor(Math.random() * 200) + 100,
            subKwh: Math.floor(Math.random() * 50) + 30,
            balance: Math.floor(Math.random() * 2000) + 1000,
            payment: Math.floor(Math.random() * 150) + 50,
            status: Math.random() < 0.5 ? 'pending' : 'paid',
        };

        sampleData.push(billingEntry);
    }

    return sampleData;
};

const randomDate = (start: Date, end: Date) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const sampleData = generateSampleData(50)

export const filteredDataFields = ["date", "totalKwh", "subKwh", "balance", "payment", "status"]

export const store = writable({
    filteredField: '',
    isLoggedIn: false
})