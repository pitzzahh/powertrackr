import { describe, it, expect, vi } from "vitest";
import { eq } from "drizzle-orm";

vi.mock("$app/server", () => ({ getRequestEvent: () => null }));
vi.mock("#lib/server/oauth.js", () => ({
  createGitHub: () => ({
    validateAuthorizationCode: async () => ({ accessToken: () => "token" }),
  }),
}));

import { GET } from "../+server";
import { addUser } from "#lib/server/crud/user-crud.js";
import { addSession } from "#lib/server/crud/session-crud.js";
import { db } from "#lib/server/db/index.js";
import { session as sessionTable, user as userTable } from "#lib/server/db/schema/index.js";
import { createUser, createSession } from "#lib/server/crud/__tests__/helpers/factories.js";

function githubEvent(email: string, githubId: number) {
  const url = new URL("http://localhost/auth/callback?oauth=github&code=c&state=s");
  const json = (body: unknown) => new Response(JSON.stringify(body));
  return {
    url,
    request: new Request(url),
    getClientAddress: () => "127.0.0.1",
    cookies: { get: () => "s", set: () => {}, delete: () => {} },
    fetch: async (req: Request) =>
      req.url.endsWith("/user/emails")
        ? json([{ email, primary: true, verified: true }])
        : json({ id: githubId, login: "gh", name: "GH", avatar_url: "" }),
  } as unknown as Parameters<typeof GET>[0];
}

describe("GitHub callback", () => {
  it("signs up new users as verified", async () => {
    await GET(githubEvent("new@example.com", 9001));
    const [u] = await db().select().from(userTable).where(eq(userTable.githubId, 9001));
    expect(u.emailVerified).toBe(true);
  });

  it("claiming an unverified account drops the squatter's password, 2FA and sessions", async () => {
    const {
      value: [squatter],
    } = await addUser([
      createUser({
        githubId: null,
        email: "victim@example.com",
        emailVerified: false,
        passwordHash: "hash",
        registeredTwoFactor: true,
      }),
    ]);
    await addSession([createSession({ userId: squatter.id })]);

    await GET(githubEvent("victim@example.com", 9002));

    const [u] = await db().select().from(userTable).where(eq(userTable.id, squatter.id));
    expect(u).toMatchObject({
      githubId: 9002,
      emailVerified: true,
      passwordHash: null,
      registeredTwoFactor: false,
    });
    const left = await db().select().from(sessionTable).where(eq(sessionTable.userId, u.id));
    expect(left).toHaveLength(1); // only the session the callback just created
  });

  it("linking a verified account keeps its password", async () => {
    const {
      value: [owner],
    } = await addUser([
      createUser({
        githubId: null,
        email: "me@example.com",
        emailVerified: true,
        passwordHash: "hash",
      }),
    ]);
    await GET(githubEvent("me@example.com", 9003));
    const [u] = await db().select().from(userTable).where(eq(userTable.id, owner.id));
    expect(u).toMatchObject({ githubId: 9003, passwordHash: "hash" });
  });
});
