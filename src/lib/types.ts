import type { BillingInfo, User, Payment } from '@prisma/client';

export type NavItem = {
	text: string;
	href: string;
	icon: any;
	selected: boolean | false;
};

export type BillingInfoDTO = {
	id: string;
	date: string;
	totalKwh: number;
	subKwh: number;
	payPerKwh: number;
	subReadingOld: number;
	subReadingLatest: number;
	balance: number;
	payment: number;
	subPayment: number;
	status: 'pending' | 'paid';
};

export type ExtendedBillingInfo = BillingInfo & {
	payment: Payment | null;
	subPayment: Payment | null;
};

export type State = {
	isAddingBill: boolean;
	user: User | null | undefined;
	history: ExtendedBillingInfo[] | undefined;
};
