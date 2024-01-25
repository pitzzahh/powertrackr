import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prismaClient } from '$lib/server/prisma';
import { formatDate } from '$lib';

export const load = (async ({ locals }) => {
    const session = await locals.auth.validate();
    if (!session) throw redirect(302, '/auth/login');

    const billingInfos = await prismaClient.billingInfo.findMany({
        where: {
            user_id: session.user.userId
        }
    });

    const data = billingInfos.map((bill) => {
        return {
            id: bill.id,
            date: formatDate(new Date(bill.date)),
            totalKwh: bill.totalKwh,
            subKwh: bill.subKwh,
            balance: bill.balance,
            payment: bill.payment,
            status: bill.status
        }
    }) as BillingInfoDTO[];

    return {
        history: data
    }

}) satisfies PageServerLoad;