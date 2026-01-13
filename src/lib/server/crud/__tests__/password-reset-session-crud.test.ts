import { describe, it, expect, beforeEach } from "vitest";
import {
  addPasswordResetSession,
  updatePasswordResetSessionBy,
  getPasswordResetSessionBy,
  getPasswordResetSessions,
  getPasswordResetSessionCountBy,
  mapNewPasswordResetSession_to_DTO,
  generatePasswordResetSessionQueryConditions,
} from "../password-reset-session-crud";
import { createPasswordResetSession, createUser, resetSequence } from "./helpers/factories";
import { addUser } from "../user-crud";
import type { NewPasswordResetSession } from "$/types/password-reset-session";
import type { HelperParam } from "$/types/helper";

describe("Password Reset Session CRUD Operations", () => {
  beforeEach(() => {
    resetSequence();
  });

  describe("addPasswordResetSession", () => {
    it("should successfully add a single password reset session", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const expiresAt = Date.now() + 15 * 60 * 1000;
      const sessionData = [
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({
            userId,
            email: "reset@example.com",
            code: "RESET123",
            expiresAt,
          });
          return rest;
        })(),
      ];

      const result = await addPasswordResetSession(sessionData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 password reset session(s) added");
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toHaveProperty("id");
      expect(result.value[0].userId).toBe(userId);
      expect(result.value[0].email).toBe("reset@example.com");
      expect(result.value[0].code).toBe("RESET123");
      expect(result.value[0].expiresAt).toBe(expiresAt);
    });

    it("should successfully add multiple password reset sessions", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const sessionsData = Array.from({ length: 3 }, (_, i) =>
        createPasswordResetSession({
          userId,
          email: `reset${i}@example.com`,
          code: `CODE${i}`,
        })
      ).map((s) => {
        const { id: _, ...rest } = s;
        return rest;
      });

      const result = await addPasswordResetSession(sessionsData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("3 password reset session(s) added");
      expect(result.value).toHaveLength(3);
      expect(result.value.every((r) => r.userId === userId)).toBe(true);
    });

    it("should handle empty array input", async () => {
      const result = await addPasswordResetSession([]);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("0 password reset session(s) added");
      expect(result.value).toHaveLength(0);
    });

    it("should handle emailVerified and twoFactorVerified flags", async () => {
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
          const { id: _, ...rest } = createPasswordResetSession({
            userId,
            emailVerified: true,
            twoFactorVerified: true,
          });
          return rest;
        })(),
      ];

      const result = await addPasswordResetSession(sessionData);

      expect(result.valid).toBe(true);
      expect(result.value[0].emailVerified).toBe(true);
      expect(result.value[0].twoFactorVerified).toBe(true);
    });
  });

  describe("getPasswordResetSessionBy", () => {
    it("should find password reset session by ID", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const addResult = await addPasswordResetSession([
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({ userId });
          return rest;
        })(),
      ]);
      const added = addResult.value[0];

      const searchParam: HelperParam<NewPasswordResetSession> = {
        query: { id: added.id },
        options: {},
      };

      const result = await getPasswordResetSessionBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 password reset session(s) found");
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe(added.id);
    });

    it("should find password reset sessions by userId", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      await addPasswordResetSession([
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({ userId });
          return rest;
        })(),
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({ userId });
          return rest;
        })(),
      ]);

      const result = await getPasswordResetSessionBy({ query: { userId }, options: {} });

      expect(result.valid).toBe(true);
      expect(result.value.length).toBeGreaterThanOrEqual(2);
      expect(result.value.every((r) => r.userId === userId)).toBe(true);
    });

    it("should find password reset session by email", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      await addPasswordResetSession([
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({
            userId,
            email: "find@example.com",
          });
          return rest;
        })(),
      ]);

      const result = await getPasswordResetSessionBy({
        query: { email: "find@example.com" } as unknown as NewPasswordResetSession,
        options: {},
      });

      expect(result.valid).toBe(true);
      expect(result.value[0].email).toBe("find@example.com");
    });

    it("should find password reset session by code", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      await addPasswordResetSession([
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({ userId, code: "CODEFIND123" });
          return rest;
        })(),
      ]);

      const result = await getPasswordResetSessionBy({
        query: { code: "CODEFIND123" } as unknown as NewPasswordResetSession,
        options: {},
      });

      expect(result.valid).toBe(true);
      expect(result.value[0].code).toBe("CODEFIND123");
    });

    it("should find password reset session by expiresAt", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const ts = Date.now() + 60 * 60 * 1000;
      const addResult = await addPasswordResetSession([
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({ userId, expiresAt: ts });
          return rest;
        })(),
      ]);
      const added = addResult.value[0];

      const result = await getPasswordResetSessionBy({
        query: { expiresAt: ts } as unknown as NewPasswordResetSession,
        options: {},
      });

      expect(result.valid).toBe(true);
      expect(result.value[0].expiresAt).toBe(ts);
    });

    it("should find by emailVerified and twoFactorVerified flags", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      await addPasswordResetSession([
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({
            userId,
            emailVerified: true,
            twoFactorVerified: true,
          });
          return rest;
        })(),
      ]);

      const byEmailVerified = await getPasswordResetSessionBy({
        query: { emailVerified: true } as unknown as NewPasswordResetSession,
        options: {},
      });
      expect(byEmailVerified.valid).toBe(true);
      expect(byEmailVerified.value[0].emailVerified).toBe(true);

      const byTwoFactor = await getPasswordResetSessionBy({
        query: { twoFactorVerified: true } as unknown as NewPasswordResetSession,
        options: {},
      });
      expect(byTwoFactor.valid).toBe(true);
      expect(byTwoFactor.value[0].twoFactorVerified).toBe(true);
    });

    it("should return empty result when not found", async () => {
      const result = await getPasswordResetSessionBy({ query: { id: "nope" }, options: {} });
      expect(result.valid).toBe(false);
      expect(result.value).toHaveLength(0);
    });

    it("should apply limit and offset and fields selection", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const data = Array.from({ length: 5 }, (_, i) =>
        createPasswordResetSession({ userId, email: `t${i}@ex.com` })
      ).map((r) => {
        const { id: _, ...rest } = r;
        return rest;
      });
      await addPasswordResetSession(data);

      const limited = await getPasswordResetSessionBy({ query: {}, options: { limit: 3 } });
      expect(limited.valid).toBe(true);
      expect(limited.value).toHaveLength(3);

      const offseted = await getPasswordResetSessionBy({
        query: {},
        options: { offset: 2, limit: 2 },
      });
      expect(offseted.valid).toBe(true);
      expect(offseted.value).toHaveLength(2);

      const fields = await getPasswordResetSessionBy({
        query: {},
        options: { fields: ["id", "email"] as (keyof NewPasswordResetSession)[] },
      });
      expect(fields.valid).toBe(true);
      expect(fields.value[0]).toHaveProperty("email");
    });

    it("should exclude specified ID", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const addResult = await addPasswordResetSession([
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({ userId });
          return rest;
        })(),
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({ userId });
          return rest;
        })(),
      ]);
      const excluded = addResult.value[0].id;

      const result = await getPasswordResetSessionBy({
        query: {},
        options: { exclude_id: excluded },
      });
      expect(result.valid).toBe(true);
      expect(result.value.every((r) => r.id !== excluded)).toBe(true);
    });
  });

  describe("updatePasswordResetSessionBy", () => {
    it("should successfully update password reset session by ID", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const addResult = await addPasswordResetSession([
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({ userId, code: "OLD" });
          return rest;
        })(),
      ]);
      const added = addResult.value[0];

      const updateParam: HelperParam<NewPasswordResetSession> = {
        query: { id: added.id },
        options: {},
      };
      const result = await updatePasswordResetSessionBy(updateParam, {
        code: "NEW",
        emailVerified: true,
      });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 password reset session(s) updated");
      expect(result.value[0].code).toBe("NEW");
      expect(result.value[0].emailVerified).toBe(true);
    });

    it("should handle no data changed scenario", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const addResult = await addPasswordResetSession([
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({ userId, code: "SAME" });
          return rest;
        })(),
      ]);
      const added = addResult.value[0];

      const updateParam: HelperParam<NewPasswordResetSession> = {
        query: { id: added.id },
        options: {},
      };
      const result = await updatePasswordResetSessionBy(updateParam, { code: "SAME" });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("No data changed");
      expect(result.value[0].id).toBe(added.id);
    });

    it("should handle nonexistent session update", async () => {
      const updateParam: HelperParam<NewPasswordResetSession> = {
        query: { id: "nope" },
        options: {},
      };
      const result = await updatePasswordResetSessionBy(updateParam, { code: "X" });

      expect(result.valid).toBe(false);
      expect(result.message).toContain("id: nope not found");
    });

    it("should update multiple fields at once", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const addResult = await addPasswordResetSession([
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({ userId, code: "INIT" });
          return rest;
        })(),
      ]);
      const added = addResult.value[0];

      const updateParam: HelperParam<NewPasswordResetSession> = {
        query: { id: added.id },
        options: {},
      };
      const result = await updatePasswordResetSessionBy(updateParam, {
        code: "MUL",
        emailVerified: true,
        twoFactorVerified: true,
      });

      expect(result.valid).toBe(true);
      expect(result.value[0].code).toBe("MUL");
      expect(result.value[0].emailVerified).toBe(true);
      expect(result.value[0].twoFactorVerified).toBe(true);
    });

    it("should perform update when update data is empty", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const addResult = await addPasswordResetSession([
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({ userId });
          return rest;
        })(),
      ]);
      const added = addResult.value[0];

      const updateParam: HelperParam<NewPasswordResetSession> = {
        query: { id: added.id },
        options: {},
      };
      const result = await updatePasswordResetSessionBy(updateParam, {});

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 password reset session(s) updated");
      expect(result.value[0].id).toBe(added.id);
    });

    it("should treat empty string code as no data changed", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const addResult = await addPasswordResetSession([
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({ userId, code: "INIT" });
          return rest;
        })(),
      ]);
      const added = addResult.value[0];

      const updateParam: HelperParam<NewPasswordResetSession> = {
        query: { id: added.id },
        options: {},
      };
      const result = await updatePasswordResetSessionBy(updateParam, { code: "" });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("No data changed");
      expect(result.value[0].code).toBe("INIT");
    });
  });

  describe("getPasswordResetSessionCountBy", () => {
    it("should return correct count for existing password reset sessions", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      const data = Array.from({ length: 5 }, () => {
        const { id: _, ...rest } = createPasswordResetSession({ userId });
        return rest;
      });
      await addPasswordResetSession(data);

      const result = await getPasswordResetSessionCountBy({ query: {}, options: {} });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
      expect(result.message).toBe("Password reset session(s) count is 5");
    });

    it("should return zero count when none match", async () => {
      const result = await getPasswordResetSessionCountBy({
        query: { email: "nope" },
        options: {},
      });
      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
      expect(result.message).toContain("email: nope not found");
    });

    it("should count by emailVerified flag", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      await addPasswordResetSession([
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({ userId, emailVerified: true });
          return rest;
        })(),
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({ userId, emailVerified: true });
          return rest;
        })(),
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({ userId, emailVerified: false });
          return rest;
        })(),
      ]);

      const result = await getPasswordResetSessionCountBy({
        query: { emailVerified: true } as unknown as NewPasswordResetSession,
        options: {},
      });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(2);
    });
  });

  describe("getPasswordResetSessions & mapNewPasswordResetSession_to_DTO", () => {
    it("should return DTO format password reset sessions", async () => {
      const userResult = await addUser([
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ]);
      const userId = userResult.value[0].id;

      await addPasswordResetSession([
        (() => {
          const { id: _, ...rest } = createPasswordResetSession({
            userId,
            email: "dto@example.com",
            code: "DTO",
          });
          return rest;
        })(),
      ]);

      const result = await getPasswordResetSessions({ query: {}, options: {} });

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("dto@example.com");
      expect(result[0].code).toBe("DTO");
      expect(typeof result[0].expiresAt).toBe("number");
    });

    it("should return empty array when none found", async () => {
      const result = await getPasswordResetSessions({ query: { userId: "no" }, options: {} });
      expect(result).toHaveLength(0);
    });

    it("mapNewPasswordResetSession_to_DTO should handle missing values", async () => {
      const input: Partial<NewPasswordResetSession>[] = [
        {
          id: undefined as unknown as string,
          userId: undefined as unknown as string,
          email: undefined,
          code: undefined,
          expiresAt: undefined,
        },
      ];

      const dto = await mapNewPasswordResetSession_to_DTO(input);
      expect(dto).toHaveLength(1);
      expect(dto[0].id).toBe("");
      expect(dto[0].email).toBe("");
      expect(dto[0].code).toBe("");
      expect(dto[0].expiresAt).toBe(0);
      expect(dto[0].emailVerified).toBe(false);
    });
  });

  describe("generatePasswordResetSessionQueryConditions", () => {
    it("should generate correct conditions for single field", () => {
      const param: HelperParam<NewPasswordResetSession> = {
        query: { email: "a@b.com" } as unknown as NewPasswordResetSession,
        options: {},
      };
      const cond = generatePasswordResetSessionQueryConditions(param);
      expect(cond.email).toBe("a@b.com");
    });

    it("should generate correct conditions for multiple fields", () => {
      const param: HelperParam<NewPasswordResetSession> = {
        query: {
          id: "p-1",
          userId: "user-1",
          email: "e@x",
          code: "c",
          expiresAt: 1234,
          emailVerified: true,
          twoFactorVerified: true,
        } as unknown as NewPasswordResetSession,
        options: {},
      };

      const cond = generatePasswordResetSessionQueryConditions(param);
      expect(cond.id).toBe("p-1");
      expect(cond.userId).toBe("user-1");
      expect((cond as any).email).toBe("e@x");
      expect((cond as any).expiresAt).toBe(1234);
      expect((cond as any).emailVerified).toBe(true);
    });

    it("should handle exclude_id option", () => {
      const param: HelperParam<NewPasswordResetSession> = {
        query: {} as unknown as NewPasswordResetSession,
        options: { exclude_id: "exclude-me" },
      };
      const cond = generatePasswordResetSessionQueryConditions(param);
      expect((cond as any).NOT.id).toBe("exclude-me");
    });

    it("should ignore undefined/null fields", () => {
      const param: HelperParam<NewPasswordResetSession> = {
        query: {
          email: undefined as unknown as string,
          id: undefined as unknown as string,
        } as unknown as NewPasswordResetSession,
        options: {},
      };
      const cond = generatePasswordResetSessionQueryConditions(param);
      expect(Object.keys(cond)).toHaveLength(0);
    });
  });
});
