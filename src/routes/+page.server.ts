import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { billFormSchema } from '$lib/config/formSchema';
import { prismaClient } from '$lib/server/prisma';
import { calculatePayPerKwh } from '$lib';

export const load = (async () => {
	return {
		form: await superValidate(billFormSchema)
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async (event) => {
		const billForm = await superValidate(event, billFormSchema);
		if (!billForm.valid) {
			return fail(400, {
				form: billForm
			});
		}
		const session = await event.locals.auth.validate();

		if (!session) {
			redirect(302, '/auth/login');
		}

		const user = await prismaClient.user.findUnique({
			where: {
				id: session.user.userId
			}
		});

		if (!user) {
			return fail(401, {
				message: 'Unauthorized'
			});
		}

		let { date, balance, totalKwh, subReading, status } = billForm.data;

		if (!balance || !totalKwh) {
			return fail(400, {
				form: billForm
			});
		}

		const latestBill = await prismaClient.billingInfo.findFirst({
			orderBy: {
				date: 'desc'
			},
			where: {
				user_id: user?.id
			}
		});

		const subReadingOld = latestBill?.subReadingLatest ?? null;
		const subKwh = subReadingOld ? (subReading ? Number(subReading) - subReadingOld : null) : null;
		const subPayment: number | null = subReadingOld
			? subKwh
				? subKwh * calculatePayPerKwh(Number(balance), Number(totalKwh))
				: null
			: null;

		const bill = await prismaClient.billingInfo.create({
			data: {
				date: new Date(date),
				totalKwh: Number(totalKwh),
				balance: Number(balance),
				payment: subPayment
					? { create: { amount: subPayment ? Number(balance) - subPayment : Number(balance) } }
					: undefined,
				payPerKwh: calculatePayPerKwh(Number(balance), Number(totalKwh)),
				subReadingLatest: subReading ? Number(subReading) : undefined,
				subReadingOld: subReadingOld,
				subKwh,
				subPayment: subPayment ? { create: { amount: subPayment } } : undefined,
				status: status ? 'Paid' : 'Pending',
				user: {
					connect: {
						id: user?.id
					}
				}
			}
		});

		console.log(`Added bill: ${JSON.stringify(bill, null, 2)}`);

		return {
			form: billForm
		};
	}
};
