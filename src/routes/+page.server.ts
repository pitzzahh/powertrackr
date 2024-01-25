import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { fail } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms/server";
import { billFormSchema } from '$lib/config/formSchema';
import { prismaClient } from '$lib/server/prisma';
import { calculatePayPerKwh } from '$lib';

export const load = (async () => {
    return {
        form: await superValidate(billFormSchema)
    }
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

        const { balance, totalKwh, subReading, payment, status } = billForm.data;

        const latestBill = await prismaClient.billingInfo.findFirst({
            orderBy: {
                date: 'desc'
            }
        });

        console.log(`latestBill: ${JSON.stringify(latestBill)}`);

        const subReadingLatest = latestBill?.subReadingLatest ?? null;
        const subKwh = subReadingLatest ? subReading ? subReadingLatest - subReading : null : null;
        const subPayment = subReadingLatest ? subKwh ? subKwh * calculatePayPerKwh(balance, totalKwh) : null : null;

        const bill = await prismaClient.billingInfo.create({
            data: {
                date: new Date(),
                totalKwh,
                balance,
                payment,
                payPerKwh: calculatePayPerKwh(balance, totalKwh),
                subReadingLatest,
                subReadingOld: subReadingLatest,
                subKwh,
                subPayment,
                status: status ? "Paid" : "Pending",
                user: {
                    connect: {
                        id: user?.id
                    }
                }
            }
        });

        console.log(`bill: ${JSON.stringify(bill)}`);

        return fail(500, {
            message: 'An unknown error occurred',
            form: billForm
        });

    }
};