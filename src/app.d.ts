import { PrismaClient } from '@prisma/client/edge'
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			auth: import("lucia").AuthRequest,
			validate: import("@lucia-auth/sveltekit").Validate,
			validateUser: import("@lucia-auth/sveltekit").ValidateUser,
			setSession: import("@lucia-auth/sveltekit").SetSession
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
	var __prisma: PrismaClient

	declare namespace Lucia {
		type Auth = import("$lib/server/lucia").Auth
		type DatabaseUserAttributes = {
			username: string,
			name: string
		};
		type DatabaseSessionAttributes = Record<string, never>;
	}
}

export { };
