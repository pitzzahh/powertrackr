import type { Session } from 'lucia';
import type { LayoutServerLoad } from './$types';
import { prismaClient } from '$lib/server/prisma';
import type { User } from '@prisma/client';
import type { ExtendedBillingInfo } from '$lib/types';

export const load = (async ({ locals }) => {
	const session: Session = await locals.auth.validate();
	if (session) {
		const user = (await prismaClient.user.findUnique({
			where: {
				id: session.user.userId
			}
		})) as User;

		const history = (await prismaClient.billingInfo.findMany({
			where: {
				user_id: user.id
			},
			include: {
				payment: true,
				subPayment: true
			}
		})) as ExtendedBillingInfo[] | undefined;

		return {
			user,
			history
		};
	}
}) satisfies LayoutServerLoad;
