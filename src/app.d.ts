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
		type UserAttributes = {
			username: string,
			name: string
		}
	}
}

export { };
