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

export const generateSampleData = (count: number) => {
    const sampleData: { date: Date; value: number; }[] = [];

    let trendDirection = 1;
    let trendDuration = 0;

    for (let i = 0; i < count; i++) {
        const date = randomDate(new Date(2002, 0, 1), new Date());
        while (sampleData.some((x) => x.date.getTime() === date.getTime())) {
            date.setDate(randomDate(new Date(2002, 0, 1), new Date()).getDate());
        }

        if (trendDuration <= 0) {
            trendDirection *= -1;
            trendDuration = Math.floor(Math.random() * 10) + 1; 
        }

        const previousValue = i > 0 ? sampleData[i - 1].value : 10; 
        const trendChange = trendDirection * (Math.random() * 5); 
        const newValue = previousValue + trendChange;

        const value = Math.max(10, newValue); 

        trendDuration--;

        sampleData.push({ date, value });
    }
    return sampleData.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export const calculatePayPerKwh = (balance: number, totalKwh: number) => {
    return Number((balance / totalKwh).toFixed(2));
}
