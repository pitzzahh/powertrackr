import { describe, it, expect, beforeEach } from "vitest";
import {
  addSession,
  updateSessionBy,
  getSessionBy,
  getSessions,
  getSessionCountBy,
  mapNewSession_to_DTO,
  generateSessionQueryConditions,
} from "../session-crud";
import { createSession, createSessions, createUser, resetSequence } from "./helpers/factories";
import { addUser } from "../user-crud";
import type { NewSession } from "$/types/session";
import type { HelperParam } from "$/types/helper";

describe("Session CRUD Operations", () => {
  beforeEach(() => {
    resetSequence();
  });

  describe("addSession", () => {
    it("should successfully add a single session", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const sessionData = [
        (() => {
          const { id: _, ...rest } = createSession({
            userId,
            ipAddress: "127.0.0.1",
            userAgent: "TestAgent/1.0",
            twoFactorVerified: true,
          });
          return rest;
        })(),
      ];

      const result = await addSession(sessionData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 session(s) added");
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toHaveProperty("id");
      expect(result.value[0].userId).toBe(userId);
      expect(result.value[0].ipAddress).toBe("127.0.0.1");
      expect(result.value[0].userAgent).toBe("TestAgent/1.0");
      expect(result.value[0].twoFactorVerified).toBe(true);
    });

    it("should successfully add multiple sessions", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const sessionsData = createSessions(3, { userId }).map((s) => {
        const { id: _, ...rest } = s;
        return rest;
      });

      const result = await addSession(sessionsData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("3 session(s) added");
      expect(result.value).toHaveLength(3);
      expect(result.value.every((s) => s.id)).toBe(true);
    });

    it("should handle empty array input", async () => {
      const result = await addSession([]);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("0 session(s) added");
      expect(result.value).toHaveLength(0);
    });

    it("should handle session with twoFactorVerified flag", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const sessionData = [
        (() => {
          const { id: _, ...rest } = createSession({
            userId,
            twoFactorVerified: true,
          });
          return rest;
        })(),
      ];

      const result = await addSession(sessionData);

      expect(result.valid).toBe(true);
      expect(result.value[0].twoFactorVerified).toBe(true);
    });
  });

  describe("getSessionBy", () => {
    it("should find session by ID", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const addResult = await addSession([
        (() => {
          const { id: _, ...rest } = createSession({ userId });
          return rest;
        })(),
      ]);
      const added = addResult.value[0];

      const searchParam: HelperParam<NewSession> = {
        query: { id: added.id },
        options: {},
      };

      const result = await getSessionBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 session(s) found");
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe(added.id);
    });

    it("should find session by userId", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      await addSession(
        createSessions(2, { userId }).map((s) => {
          const { id: _, ...rest } = s;
          return rest;
        })
      );

      const searchParam: HelperParam<NewSession> = {
        query: { userId },
        options: {},
      };

      const result = await getSessionBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value.some((s) => s.userId === userId)).toBe(true);
    });

    it("should find session by ipAddress", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      await addSession([
        (() => {
          const { id: _, ...rest } = createSession({ userId, ipAddress: "10.0.0.1" });
          return rest;
        })(),
      ]);

      const searchParam: HelperParam<NewSession> = {
        query: { ipAddress: "10.0.0.1" } as unknown as NewSession,
        options: {},
      };

      const result = await getSessionBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value[0].ipAddress).toBe("10.0.0.1");
    });

    it("should find session by userAgent", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      await addSession([
        (() => {
          const { id: _, ...rest } = createSession({ userId, userAgent: "Agent/2.0" });
          return rest;
        })(),
      ]);

      const searchParam: HelperParam<NewSession> = {
        query: { userAgent: "Agent/2.0" } as unknown as NewSession,
        options: {},
      };

      const result = await getSessionBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value[0].userAgent).toBe("Agent/2.0");
    });

    it("should find session by expiresAt (try both Date and numeric forms)", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const expDateMs = Date.now() + 60 * 1000;
      const expDate = new Date(expDateMs).toISOString();
      const addResult = await addSession([
        (() => {
          const { id: _, ...rest } = createSession({ userId, expiresAt: expDate });
          return rest;
        })(),
      ]);
      const added = addResult.value[0];

      // Try both Date and numeric milliseconds forms as some adapters serialize differently
      const resultByDate = await getSessionBy({
        query: { expiresAt: added.expiresAt } as unknown as NewSession,
        options: {},
      });

      const resultByNumber = await getSessionBy({
        query: {
          expiresAt:
            (added.expiresAt as any) instanceof Date
              ? (added.expiresAt as any).getTime()
              : (added.expiresAt as unknown as number),
        } as unknown as NewSession,
        options: {},
      });

      expect(resultByDate.valid || resultByNumber.valid).toBe(true);
      const found = resultByDate.valid ? resultByDate.value[0] : resultByNumber.value[0];
      expect(found.id).toBe(added.id);
    });

    it("should return empty result when session not found", async () => {
      const searchParam: HelperParam<NewSession> = {
        query: { id: "nonexistent-id" },
        options: {},
      };

      const result = await getSessionBy(searchParam);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("id: nonexistent-id not found");
      expect(result.value).toHaveLength(0);
    });

    it("should apply limit option", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const sessionsData = createSessions(5, { userId }).map((s) => {
        const { id: _, ...rest } = s;
        return rest;
      });
      await addSession(sessionsData);

      const searchParam: HelperParam<NewSession> = {
        query: {},
        options: { limit: 3 },
      };

      const result = await getSessionBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(3);
    });

    it("should apply offset option", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const sessionsData = createSessions(5, { userId }).map((s) => {
        const { id: _, ...rest } = s;
        return rest;
      });
      await addSession(sessionsData);

      const searchParam: HelperParam<NewSession> = {
        query: {},
        options: { offset: 2, limit: 2 },
      };

      const result = await getSessionBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(2);
    });

    it("should apply fields selection", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const { id: _, ...sessionWithoutId } = createSession({
        userId,
        ipAddress: "1.2.3.4",
        userAgent: "Agent/3.0",
      });
      await addSession([sessionWithoutId]);

      const searchParam: HelperParam<NewSession> = {
        query: { userId },
        options: { fields: ["id", "ipAddress", "userAgent"] as (keyof NewSession)[] },
      };

      const result = await getSessionBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toHaveProperty("ipAddress");
    });

    it("should exclude specified ID", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const addResult = await addSession(
        createSessions(2, { userId }).map((s) => {
          const { id: _, ...rest } = s;
          return rest;
        })
      );
      const excludedId = addResult.value[0].id;

      const searchParam: HelperParam<NewSession> = {
        query: {},
        options: { exclude_id: excludedId },
      };

      const result = await getSessionBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value.every((s) => s.id !== excludedId)).toBe(true);
    });
  });

  describe("updateSessionBy", () => {
    it("should successfully update session by ID", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const addResult = await addSession([
        (() => {
          const { id: _, ...rest } = createSession({
            userId,
            userAgent: "InitAgent",
            twoFactorVerified: false,
          });
          return rest;
        })(),
      ]);
      const added = addResult.value[0];

      const updateParam: HelperParam<NewSession> = {
        query: { id: added.id },
        options: {},
      };

      const updateData: Partial<NewSession> = {
        userAgent: "UpdatedAgent",
        twoFactorVerified: true,
      };

      const result = await updateSessionBy(updateParam, updateData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 session(s) updated");
      expect(result.value[0].userAgent).toBe("UpdatedAgent");
      expect(result.value[0].twoFactorVerified).toBe(true);
    });

    it("should handle no data changed scenario", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const addResult = await addSession([
        (() => {
          const { id: _, ...rest } = createSession({ userId, userAgent: "SameAgent" });
          return rest;
        })(),
      ]);
      const added = addResult.value[0];

      const updateParam: HelperParam<NewSession> = {
        query: { id: added.id },
        options: {},
      };

      const result = await updateSessionBy(updateParam, { userAgent: "SameAgent" });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("No data changed");
      expect(result.value[0].id).toBe(added.id);
    });

    it("should handle nonexistent session update", async () => {
      const updateParam: HelperParam<NewSession> = {
        query: { id: "nonexistent-id" },
        options: {},
      };

      const result = await updateSessionBy(updateParam, { userAgent: "X" });

      expect(result.valid).toBe(false);
      expect(result.message).toContain("id: nonexistent-id not found");
    });

    it("should update expiresAt", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const addResult = await addSession([
        (() => {
          const { id: _, ...rest } = createSession({ userId });
          return rest;
        })(),
      ]);
      const added = addResult.value[0];

      const updateParam: HelperParam<NewSession> = {
        query: { id: added.id },
        options: {},
      };

      const newExpirationMs = Date.now() + 24 * 60 * 60 * 1000;
      const result = await updateSessionBy(updateParam, {
        expiresAt: new Date(newExpirationMs).toISOString(),
      });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 session(s) updated");
    });
  });

  describe("getSessionCountBy", () => {
    it("should return correct count for existing sessions", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const sessionsData = createSessions(5, { userId }).map((s) => {
        const { id: _, ...rest } = s;
        return rest;
      });
      await addSession(sessionsData);

      const countParam: HelperParam<NewSession> = {
        query: {},
        options: {},
      };

      const result = await getSessionCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
      expect(result.message).toBe("Session(s) count is 5");
    });

    it("should return zero count when no sessions match", async () => {
      const countParam: HelperParam<NewSession> = {
        query: { userId: "not-found" },
        options: {},
      };

      const result = await getSessionCountBy(countParam);

      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
      expect(result.message).toContain("userId: not-found not found");
    });

    it("should count sessions with specific criteria", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const sessionsData = [
        createSession({ userId, twoFactorVerified: true }),
        createSession({ userId, twoFactorVerified: true }),
        createSession({ userId, twoFactorVerified: false }),
      ].map((s) => {
        const { id: _, ...rest } = s;
        return rest;
      });

      await addSession(sessionsData);

      const countParam: HelperParam<NewSession> = {
        query: { twoFactorVerified: true } as unknown as NewSession,
        options: {},
      };

      const result = await getSessionCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(2);
    });
  });

  describe("getSessions & mapNewSession_to_DTO", () => {
    it("should return DTO format sessions", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      await addSession([
        (() => {
          const { id: _, ...rest } = createSession({
            userId,
            ipAddress: "8.8.8.8",
            userAgent: "Agent/4.0",
          });
          return rest;
        })(),
      ]);

      const result = await getSessions({ query: {}, options: {} });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBeDefined();
      expect(result[0].ipAddress).toBe("8.8.8.8");
      expect(result[0].userAgent).toBe("Agent/4.0");
      expect(result[0].expiresAt).toBeInstanceOf(Date);
      expect(typeof result[0].twoFactorVerified === "boolean").toBe(true);
    });

    it("should return empty array when no sessions found", async () => {
      const result = await getSessions({ query: { userId: "no-user" }, options: {} });
      expect(result).toHaveLength(0);
    });

    it("mapNewSession_to_DTO should handle null/undefined values", async () => {
      const input: Partial<NewSession>[] = [
        {
          id: undefined as unknown as string,
          // DB types use string for expiresAt; provide undefined as a
          // string-typed value so the mapper can normalize it to a Date.
          expiresAt: undefined as unknown as string,
          ipAddress: undefined,
          userAgent: undefined,
          userId: undefined,
          twoFactorVerified: undefined,
        },
      ];

      const dto = await mapNewSession_to_DTO(input);

      expect(dto).toHaveLength(1);
      expect(dto[0].id).toBe("");
      expect(dto[0].ipAddress).toBeNull();
      expect(dto[0].userAgent).toBeNull();
      expect(dto[0].twoFactorVerified).toBe(false);
      expect(dto[0].expiresAt).toBeInstanceOf(Date);
    });
  });

  describe("generateSessionQueryConditions", () => {
    it("should generate correct conditions for single field", () => {
      const param: HelperParam<NewSession> = {
        query: { userId: "user-1" } as unknown as NewSession,
        options: {},
      };

      const conditions = generateSessionQueryConditions(param);

      expect(conditions.userId).toBe("user-1");
    });

    it("should generate correct conditions for multiple fields", () => {
      const param: HelperParam<NewSession> = {
        query: {
          id: "s-1",
          userId: "user-1",
          ipAddress: "1.2.3.4",
          userAgent: "Agent",
          twoFactorVerified: true,
        } as unknown as NewSession,
        options: {},
      };

      const conditions = generateSessionQueryConditions(param);

      expect(conditions.id).toBe("s-1");
      expect(conditions.userId).toBe("user-1");
      expect((conditions as any).ipAddress).toBe("1.2.3.4");
      expect((conditions as any).userAgent).toBe("Agent");
      expect((conditions as any).twoFactorVerified).toBe(true);
    });

    it("should handle exclude_id option", () => {
      const param: HelperParam<NewSession> = {
        query: {} as unknown as NewSession,
        options: { exclude_id: "exclude-id" },
      };

      const conditions = generateSessionQueryConditions(param);

      expect((conditions as any).NOT.id).toBe("exclude-id");
    });

    it("should ignore undefined/null fields", () => {
      const param: HelperParam<NewSession> = {
        query: {
          id: undefined as unknown as string,
          userId: undefined as unknown as string,
        } as unknown as NewSession,
        options: {},
      };

      const conditions = generateSessionQueryConditions(param);

      expect(Object.keys(conditions)).toHaveLength(0);
    });
  });
});
