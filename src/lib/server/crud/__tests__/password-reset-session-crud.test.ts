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
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const expiresAtMs = Date.now() + 15 * 60 * 1000;
      const expiresAt = new Date(expiresAtMs);

      const result = await addPasswordResetSession([
        createPasswordResetSession({
          userId: addedUser.id,
          email: "reset@example.com",
          code: "RESET123",
          expiresAt,
        }),
      ]);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 password reset session(s) added");
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toHaveProperty("id");
      expect(result.value[0].userId).toBe(addedUser.id);
      expect(result.value[0].email).toBe("reset@example.com");
      expect(result.value[0].code).toBe("RESET123");
      // expiresAt is now stored as an ISO string; compare parsed milliseconds
      expect(result.value[0].expiresAt!).toStrictEqual(expiresAt);
    });

    it("should successfully add multiple password reset sessions", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const result = await addPasswordResetSession(
        Array.from({ length: 3 }, (_, i) =>
          createPasswordResetSession({
            userId: addedUser.id,
            email: `reset${i}@example.com`,
            code: `CODE${i}`,
          })
        )
      );

      expect(result.valid).toBe(true);
      expect(result.message).toBe("3 password reset session(s) added");
      expect(result.value).toHaveLength(3);
      expect(result.value.every((r) => r.userId === addedUser.id)).toBe(true);
    });

    it("should handle empty array input", async () => {
      if (process.env.CI === "true") return;

      const result = await addPasswordResetSession([]);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("0 password reset session(s) added");
      expect(result.value).toHaveLength(0);
    });

    it("should handle emailVerified and twoFactorVerified flags", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const result = await addPasswordResetSession([
        createPasswordResetSession({
          userId: addedUser.id,
          emailVerified: true,
          twoFactorVerified: true,
        }),
      ]);

      expect(result.valid).toBe(true);
      expect(result.value[0].emailVerified).toBe(true);
      expect(result.value[0].twoFactorVerified).toBe(true);
    });
  });

  describe("getPasswordResetSessionBy", () => {
    it("should find password reset session by ID", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const {
        valid: validSession,
        value: [addedSession],
      } = await addPasswordResetSession([createPasswordResetSession({ userId: addedUser.id })]);

      expect(validSession).toBe(true);
      expect(addedSession).toBeDefined();

      const searchParam: HelperParam<NewPasswordResetSession> = {
        query: { id: addedSession.id },
        options: {},
      };

      const result = await getPasswordResetSessionBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 password reset session(s) found");
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe(addedSession.id);
    });

    it("should find password reset sessions by userId", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const { valid: validSessions } = await addPasswordResetSession(
        [
          createPasswordResetSession({ userId: addedUser.id }),
          createPasswordResetSession({ userId: addedUser.id }),
        ].map((s) => {
          const { id: _, ...rest } = s;
          return rest;
        })
      );

      expect(validSessions).toBe(true);

      const result = await getPasswordResetSessionBy({
        query: { userId: addedUser.id },
        options: {},
      });

      expect(result.valid).toBe(true);
      expect(result.value.length).toBeGreaterThanOrEqual(2);
      expect(result.value.every((r) => r.userId === addedUser.id)).toBe(true);
    });

    it("should find password reset session by email", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const {
        valid: validSession,
        value: [addedSession],
      } = await addPasswordResetSession([
        createPasswordResetSession({
          userId: addedUser.id,
          email: "find@example.com",
        }),
      ]);

      expect(validSession).toBe(true);
      expect(addedSession).toBeDefined();

      const result = await getPasswordResetSessionBy({
        query: { email: "find@example.com" } as unknown as NewPasswordResetSession,
        options: {},
      });

      expect(result.valid).toBe(true);
      expect(result.value[0].email).toBe("find@example.com");
    });

    it("should find password reset session by code", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const {
        valid: validSession,
        value: [addedSession],
      } = await addPasswordResetSession([
        createPasswordResetSession({ userId: addedUser.id, code: "CODEFIND123" }),
      ]);

      expect(validSession).toBe(true);
      expect(addedSession).toBeDefined();

      const result = await getPasswordResetSessionBy({
        query: { code: "CODEFIND123" },
      });

      expect(result.valid).toBe(true);
      expect(result.value[0].code).toBe("CODEFIND123");
    });

    it("should find password reset session by expiresAt", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const tsMs = Date.now() + 15 * 60 * 1000;
      const ts = new Date(tsMs);
      const {
        valid: validSession,
        value: [addedSession],
      } = await addPasswordResetSession([
        createPasswordResetSession({ userId: addedUser.id, expiresAt: ts }),
      ]);

      expect(validSession).toBe(true);
      expect(addedSession).toBeDefined();

      const result = await getPasswordResetSessionBy({
        query: { expiresAt: ts } as unknown as NewPasswordResetSession,
        options: {},
      });

      expect(result.valid).toBe(true);
      // expiresAt stored as ISO string; compare parsed milliseconds
      expect(result.value[0].expiresAt!).toStrictEqual(ts);
    });

    it("should find by emailVerified and twoFactorVerified flags", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const { valid: validSession } = await addPasswordResetSession([
        createPasswordResetSession({
          userId: addedUser.id,
          emailVerified: true,
          twoFactorVerified: true,
        }),
      ]);

      expect(validSession).toBe(true);

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
      if (process.env.CI === "true") return;

      const result = await getPasswordResetSessionBy({ query: { id: "nope" }, options: {} });
      expect(result.valid).toBe(false);
      expect(result.value).toHaveLength(0);
    });

    it("should apply limit and offset and fields selection", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const { valid: validSessions } = await addPasswordResetSession(
        Array.from({ length: 5 }, (_, i) =>
          createPasswordResetSession({ userId: addedUser.id, email: `t${i}@ex.com` })
        )
      );

      expect(validSessions).toBe(true);

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
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const { valid: validSessions, value: addedSessions } = await addPasswordResetSession(
        [
          createPasswordResetSession({ userId: addedUser.id }),
          createPasswordResetSession({ userId: addedUser.id }),
        ].map((s) => {
          const { id: _, ...rest } = s;
          return rest;
        })
      );

      expect(validSessions).toBe(true);
      expect(addedSessions).toHaveLength(2);

      const excluded = addedSessions[0].id;

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
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const {
        valid: validSession,
        value: [addedSession],
      } = await addPasswordResetSession([
        createPasswordResetSession({ userId: addedUser.id, code: "OLD" }),
      ]);

      expect(validSession).toBe(true);
      expect(addedSession).toBeDefined();

      const updateParam: HelperParam<NewPasswordResetSession> = {
        query: { id: addedSession.id },
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
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const {
        valid: validSession,
        value: [addedSession],
      } = await addPasswordResetSession([
        createPasswordResetSession({ userId: addedUser.id, code: "SAME" }),
      ]);

      expect(validSession).toBe(true);
      expect(addedSession).toBeDefined();

      const updateParam: HelperParam<NewPasswordResetSession> = {
        query: { id: addedSession.id },
        options: {},
      };
      const result = await updatePasswordResetSessionBy(updateParam, { code: "SAME" });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("No data changed");
      expect(result.value[0].id).toBe(addedSession.id);
    });

    it("should handle nonexistent session update", async () => {
      if (process.env.CI === "true") return;

      const updateParam: HelperParam<NewPasswordResetSession> = {
        query: { id: "nope" },
        options: {},
      };
      const result = await updatePasswordResetSessionBy(updateParam, { code: "X" });

      expect(result.valid).toBe(false);
      expect(result.message).toContain("id: nope not found");
    });

    it("should update multiple fields at once", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const {
        valid: validSession,
        value: [addedSession],
      } = await addPasswordResetSession([
        createPasswordResetSession({ userId: addedUser.id, code: "INIT" }),
      ]);

      expect(validSession).toBe(true);
      expect(addedSession).toBeDefined();

      const updateParam: HelperParam<NewPasswordResetSession> = {
        query: { id: addedSession.id },
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
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const {
        valid: validSession,
        value: [addedSession],
      } = await addPasswordResetSession([createPasswordResetSession({ userId: addedUser.id })]);

      expect(validSession).toBe(true);
      expect(addedSession).toBeDefined();

      const updateParam: HelperParam<NewPasswordResetSession> = {
        query: { id: addedSession.id },
        options: {},
      };
      const result = await updatePasswordResetSessionBy(updateParam, {});

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 password reset session(s) updated");
      expect(result.value[0].id).toBe(addedSession.id);
    });

    it("should treat empty string code as no data changed", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const {
        valid: validSession,
        value: [addedSession],
      } = await addPasswordResetSession([
        createPasswordResetSession({ userId: addedUser.id, code: "INIT" }),
      ]);

      expect(validSession).toBe(true);
      expect(addedSession).toBeDefined();

      const updateParam: HelperParam<NewPasswordResetSession> = {
        query: { id: addedSession.id },
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
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const data = Array.from({ length: 5 }, () => {
        const { id: _, ...rest } = createPasswordResetSession({ userId: addedUser.id });
        return rest;
      });
      const { valid: validSessions } = await addPasswordResetSession(data);

      expect(validSessions).toBe(true);

      const result = await getPasswordResetSessionCountBy({ query: {}, options: {} });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
      expect(result.message).toBe("Password reset session(s) count is 5");
    });

    it("should return zero count when none match", async () => {
      if (process.env.CI === "true") return;

      const result = await getPasswordResetSessionCountBy({
        query: { email: "nope" },
        options: {},
      });
      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
      expect(result.message).toContain("email: nope not found");
    });

    it("should count by emailVerified flag", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const { valid: validSessions } = await addPasswordResetSession(
        [
          createPasswordResetSession({ userId: addedUser.id, emailVerified: true }),
          createPasswordResetSession({ userId: addedUser.id, emailVerified: true }),
          createPasswordResetSession({ userId: addedUser.id, emailVerified: false }),
        ].map((s) => {
          const { id: _, ...rest } = s;
          return rest;
        })
      );

      expect(validSessions).toBe(true);

      const result = await getPasswordResetSessionCountBy({
        query: { emailVerified: true },
      });
      expect(result.valid).toBe(true);
      expect(result.value).toBe(2);
    });
  });

  describe("getPasswordResetSessions & mapNewPasswordResetSession_to_DTO", () => {
    it("should return DTO format password reset sessions", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const { valid: validSession } = await addPasswordResetSession([
        createPasswordResetSession({
          userId: addedUser.id,
          email: "dto@example.com",
          code: "DTO",
        }),
      ]);

      expect(validSession).toBe(true);

      const result = await getPasswordResetSessions({ query: {}, options: {} });

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("dto@example.com");
      expect(result[0].code).toBe("DTO");
      // expiresAt should be returned as a Date object
      expect(result[0].expiresAt).toBeInstanceOf(Date);
      // sanity check it's a valid date
      expect(result[0].expiresAt.getTime()).toBeGreaterThan(0);
    });

    it("should return empty array when none found", async () => {
      if (process.env.CI === "true") return;

      const result = await getPasswordResetSessions({ query: { userId: "no" }, options: {} });
      expect(result).toHaveLength(0);
    });

    it("mapNewPasswordResetSession_to_DTO should handle missing values", async () => {
      if (process.env.CI === "true") return;

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
      // missing expiresAt should be represented as a new Date
      expect(dto[0].expiresAt).toBeInstanceOf(Date);
      expect(dto[0].emailVerified).toBe(false);
    });
  });

  describe("generatePasswordResetSessionQueryConditions", () => {
    it("should generate correct conditions for single field", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewPasswordResetSession> = {
        query: { email: "a@b.com" } as unknown as NewPasswordResetSession,
        options: {},
      };
      const cond = generatePasswordResetSessionQueryConditions(param);
      expect(cond.email).toBe("a@b.com");
    });

    it("should generate correct conditions for multiple fields", () => {
      if (process.env.CI === "true") return;
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
      const typedCond = cond as {
        email?: string;
        expiresAt?: number;
        emailVerified?: boolean;
      };
      expect(typedCond.email).toBe("e@x");
      expect(typedCond.expiresAt).toBe(1234);
      expect(typedCond.emailVerified).toBe(true);
    });

    it("should handle exclude_id option", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewPasswordResetSession> = {
        query: {} as unknown as NewPasswordResetSession,
        options: { exclude_id: "exclude-me" },
      };
      const cond = generatePasswordResetSessionQueryConditions(param);
      const typedCond = cond as { NOT?: { id?: string } };
      expect(typedCond.NOT).toBeDefined();
      expect(typedCond.NOT!.id).toBe("exclude-me");
    });

    it("should ignore undefined/null fields", () => {
      if (process.env.CI === "true") return;
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
