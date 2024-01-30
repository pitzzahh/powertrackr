import type { RequestHandler } from './$types';
import { prismaClient } from '$lib/server/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export const DELETE: RequestHandler = async ({ request }) => {
	const requestBody = await request.json();
	const { bill_id, user_id } = requestBody;

	if (!bill_id) {
		return new Response(JSON.stringify({ message: 'Invalid request, missing id' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'DELETE'
			}
		});
	}

	if (!user_id) {
		return new Response(JSON.stringify({ message: 'Invalid request, not authenticated' }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'DELETE'
			}
		});
	}

	try {
		const result = await prismaClient.billingInfo.delete({
			where: {
				id: bill_id,
				user_id
			},
			include: {
				payment: true,
				subPayment: true
			}
		});

		console.log(`Deleted: ${JSON.stringify(result, null, 2)}`);

		return new Response(
			JSON.stringify(
				{
					message: 'Bill deleted successfully'
				},
				null,
				2
			),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'DELETE'
				}
			}
		);
	} catch (e) {
		if (e instanceof PrismaClientKnownRequestError) {
			console.error(JSON.stringify(e, null, 2));
			return new Response(JSON.stringify({ message: e.meta?.cause ?? e.message }), {
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'DELETE'
				}
			});
		}
		return new Response(JSON.stringify({ message: 'Something went wrong' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'DELETE'
			}
		});
	}
};
