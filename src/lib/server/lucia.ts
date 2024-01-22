import { lucia, type UserSchema } from "lucia";
import { sveltekit } from "lucia/middleware";
import { dev } from "$app/environment";
import { prisma } from "@lucia-auth/adapter-prisma";
import prismaClient from "$lib/server/prisma";

export const auth = lucia({
    env: dev ? "DEV" : "PROD",
    middleware: sveltekit(),
    adapter: prisma(prismaClient),
    getUserAttributes: (data: UserSchema) => {
		return {
            name: data.name,
			username: data.username,
            picture: data.picture
		};
	}
});