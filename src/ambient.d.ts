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

type BillingInfoDTO = {
    id: string;
    date: string;
    totalKwh: number;
    subKwh: number;
    balance: number;
    payment: number;
    status: "pending" | "paid";
};