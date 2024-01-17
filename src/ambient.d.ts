type NavItem = {
	text: string,
	href: string,
	icon: SvelteComponentTyped,
	selected: boolean | false
}

type Payment = {
    id: string;
    amount: number;
    status: "pending" | "processing" | "success" | "failed";
    email: string | null;
};

type BillingInfo = {
    id: string;
    date: Date;
    totalKwh: number;
    subKwh: number;
    balance: number;
    payment: number;
    status: "pending" | "paid";
};