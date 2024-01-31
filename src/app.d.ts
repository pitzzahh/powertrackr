declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			auth: import('lucia').AuthRequest;
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
			name: string,
			picture: string | null
		};
		type DatabaseSessionAttributes = Record<string, never>;
	}
}

export { };
