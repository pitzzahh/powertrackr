import { describe, it, expect, beforeEach } from "vitest";
import {
  addEmailVerificationRequest,
  updateEmailVerificationRequestBy,
  getEmailVerificationRequestBy,
} from "../email-verification-request-crud";
import { createEmailVerificationRequest, createUser, resetSequence } from "./helpers/factories";
import { addUser } from "../user-crud";
import type { NewEmailVerificationRequest } from "#lib/types/auth.js";
import type { HelperParam } from "#lib/types/helper.js";
import { generateQueryConditions } from "#lib/server/mapper.js";

describe("Email Verification Request CRUD Operations", () => {
  beforeEach(() => {
    resetSequence();
  });

  describe("addEmailVerificationRequest", () => {
    it("should successfully add a single email verification request", async () => {
      // First create a user to reference
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser({ email: "verify@example.com" })]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

      const result = await addEmailVerificationRequest([
        createEmailVerificationRequest({
          userId: addedUser.id,
          email: "verify@example.com",
          code: "VERIFY123456",
          expiresAt,
        }),
      ]);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 email verification request(s) added");
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toHaveProperty("id");
      expect(result.value[0].userId).toBe(addedUser.id);
      expect(result.value[0].email).toBe("verify@example.com");
      expect(result.value[0].code).toBe("VERIFY123456");
      // expiresAt is stored as an ISO string; parse and compare numeric ms
      expect(new Date(result.value[0].expiresAt).getTime()).toBe(expiresAt.getTime());
    });

    it("should successfully add multiple email verification requests", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const verificationData = Array.from({ length: 3 }, (_, i) =>
        createEmailVerificationRequest({
          userId: addedUser.id,
          email: `verify${i}@example.com`,
          code: `CODE${i}`,
        })
      ).map((request) => {
        const { id: _, ...rest } = request;
        return rest;
      });

      const result = await addEmailVerificationRequest(verificationData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("3 email verification request(s) added");
      expect(result.value).toHaveLength(3);
      expect(result.value.every((request) => request.userId === addedUser.id)).toBe(true);
    });

    it("should handle empty array input", async () => {
      const result = await addEmailVerificationRequest([]);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("0 email verification request(s) added");
      expect(result.value).toHaveLength(0);
    });

    it("should handle verification request with far future expiration", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const farFuture = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId: addedUser.id,
            expiresAt: farFuture,
          });
          return rest;
        })(),
      ];

      const result = await addEmailVerificationRequest(verificationData);

      expect(result.valid).toBe(true);
      // expiresAt stored as ISO string; compare parsed milliseconds
      expect(new Date(result.value[0].expiresAt).getTime()).toBe(farFuture.getTime());
    });

    it("should handle verification request with past expiration", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const past = new Date(Date.now() - 60 * 1000); // 1 minute ago
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId: addedUser.id,
            expiresAt: past,
          });
          return rest;
        })(),
      ];

      const result = await addEmailVerificationRequest(verificationData);

      expect(result.valid).toBe(true);
      // expiresAt stored as ISO string; compare parsed milliseconds
      expect(new Date(result.value[0].expiresAt).getTime()).toBe(past.getTime());
    });

    it("should handle verification request with special characters in email", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const specialEmail = "test+special.chars@sub-domain.example.com";
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId: addedUser.id,
            email: specialEmail,
            code: "SPECIAL123!@#",
          });
          return rest;
        })(),
      ];

      const result = await addEmailVerificationRequest(verificationData);

      expect(result.valid).toBe(true);
      expect(result.value[0].email).toBe(specialEmail);
      expect(result.value[0].code).toBe("SPECIAL123!@#");
    });
  });

  describe("getEmailVerificationRequestBy", () => {
    it("should find verification request by ID", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({ userId: addedUser.id });
          return rest;
        })(),
      ];
      const addResult = await addEmailVerificationRequest(verificationData);
      const addedRequest = addResult.value[0];

      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: addedRequest.id },
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 email verification request(s) found");
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe(addedRequest.id);
    });

    it("should find verification request by user ID", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({ userId: addedUser.id });
          return rest;
        })(),
      ];
      await addEmailVerificationRequest(verificationData);

      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { userId: addedUser.id },
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].userId).toBe(addedUser.id);
    });

    it("should find verification request by email", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const testEmail = "find@example.com";
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId: addedUser.id,
            email: testEmail,
          });
          return rest;
        })(),
      ];
      await addEmailVerificationRequest(verificationData);

      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { email: testEmail },
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].email).toBe(testEmail);
    });

    it("should find verification request by code", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const testCode = "FINDME123";
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId: addedUser.id,
            code: testCode,
          });
          return rest;
        })(),
      ];
      await addEmailVerificationRequest(verificationData);

      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { code: testCode },
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].code).toBe(testCode);
    });

    it("should find verification request by expiration time", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const testExpiresAtMs = Date.now() + 30 * 60 * 1000; // 30 minutes
      const testExpiresAt = new Date(testExpiresAtMs);
      await addEmailVerificationRequest([
        createEmailVerificationRequest({
          userId: addedUser.id,
          expiresAt: testExpiresAt,
        }),
      ]);

      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { expiresAt: testExpiresAt },
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(new Date(result.value[0].expiresAt!).getTime()).toBe(testExpiresAtMs);
    });

    it("should return empty result when verification request not found", async () => {
      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: "nonexistent-id" },
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("id: nonexistent-id not found");
      expect(result.value).toHaveLength(0);
    });

    it("should apply limit option", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const verificationData = Array.from({ length: 5 }, (_, i) =>
        createEmailVerificationRequest({
          userId: addedUser.id,
          email: `test${i}@example.com`,
        })
      ).map((request) => {
        const { id: _, ...rest } = request;
        return rest;
      });
      await addEmailVerificationRequest(verificationData);

      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: {},
        options: { limit: 3 },
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(3);
    });

    it("should apply offset option", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const verificationData = Array.from({ length: 5 }, (_, i) =>
        createEmailVerificationRequest({
          userId: addedUser.id,
          email: `test${i}@example.com`,
        })
      ).map((request) => {
        const { id: _, ...rest } = request;
        return rest;
      });
      await addEmailVerificationRequest(verificationData);

      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: {},
        options: { offset: 2, limit: 2 },
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(2);
    });

    it("should apply fields selection", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({ userId: addedUser.id });
          return rest;
        })(),
      ];
      await addEmailVerificationRequest(verificationData);

      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { userId: addedUser.id },
        options: { fields: ["id", "userId", "email"] as (keyof NewEmailVerificationRequest)[] },
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toHaveProperty("id");
      expect(result.value[0]).toHaveProperty("userId");
      expect(result.value[0]).toHaveProperty("email");
    });

    it("should exclude specified ID", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const verificationData = Array.from({ length: 3 }, (_, i) =>
        createEmailVerificationRequest({
          userId: addedUser.id,
          email: `test${i}@example.com`,
        })
      ).map((request) => {
        const { id: _, ...rest } = request;
        return rest;
      });
      const addResult = await addEmailVerificationRequest(verificationData);
      const excludeId = addResult.value[1].id;

      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: {},
        options: { exclude_id: excludeId },
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(2);
      expect(result.value.every((request) => request.id !== excludeId)).toBe(true);
    });

    it("should find verification request with user relationship", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({ userId });
          return rest;
        })(),
      ];
      await addEmailVerificationRequest(verificationData);

      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { userId },
        options: { with_user: true },
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toHaveProperty("user");
    });
  });

  describe("updateEmailVerificationRequestBy", () => {
    it("should successfully update verification request by ID", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const addResult = await addEmailVerificationRequest([
        createEmailVerificationRequest({ userId: addedUser.id }),
      ]);
      const addedRequest = addResult.value[0];

      const updateParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: addedRequest.id },
      };

      const newExpiresAtMs = Date.now() + 60 * 60 * 1000;
      const result = await updateEmailVerificationRequestBy(updateParam, {
        expiresAt: new Date(newExpiresAtMs),
      });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 email verification request(s) updated");
      expect(new Date(result.value[0].expiresAt!).getTime()).toBe(newExpiresAtMs);
    });

    it("should update multiple fields at once", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const addResult = await addEmailVerificationRequest([
        createEmailVerificationRequest({
          userId: addedUser.id,
          email: "multi@example.com",
          code: "INIT123",
        }),
      ]);
      const addedRequest = addResult.value[0];

      const updateParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: addedRequest.id },
      };

      const newExpiresAtMs = Date.now() + 2 * 60 * 60 * 1000;
      const result = await updateEmailVerificationRequestBy(updateParam, {
        email: "multiupdated@example.com",
        code: "MUL123",
        expiresAt: new Date(newExpiresAtMs),
      });

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 email verification request(s) updated");
      expect(result.value[0].email).toBe("multiupdated@example.com");
      expect(result.value[0].code).toBe("MUL123");
      expect(new Date(result.value[0].expiresAt!).getTime()).toBe(newExpiresAtMs);
    });

    it("should perform update when update data is empty (sets existing non-nullish fields)", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId: addedUser.id,
            code: "SAME123",
            email: "same@example.com",
          });
          return rest;
        })(),
      ];
      const addResult = await addEmailVerificationRequest(verificationData);
      const addedRequest = addResult.value[0];

      const updateParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: addedRequest.id },
      };

      const result = await updateEmailVerificationRequestBy(updateParam, {});

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 email verification request(s) updated");
      expect(result.value[0].id).toBe(addedRequest.id);
    });

    it("should handle no data changed scenario", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId: addedUser.id,
            code: "SAME123",
          });
          return rest;
        })(),
      ];
      const addResult = await addEmailVerificationRequest(verificationData);
      const addedRequest = addResult.value[0];

      const updateParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: addedRequest.id },
      };

      const updateData = { code: "SAME123" };
      const result = await updateEmailVerificationRequestBy(updateParam, updateData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("No data changed");
      expect(result.value[0].id).toBe(addedRequest.id);
    });

    it("should handle nonexistent verification request update", async () => {
      const updateParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: "nonexistent-id" },
      };

      const updateData = { code: "NEWCODE" };
      const result = await updateEmailVerificationRequestBy(updateParam, updateData);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("id: nonexistent-id not found");
    });

    it("should update expiration time", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const addResult = await addEmailVerificationRequest([
        createEmailVerificationRequest({ userId: addedUser.id }),
      ]);
      const addedRequest = addResult.value[0];

      const newExpirationMs = Date.now() + 24 * 60 * 60 * 1000;
      const result = await updateEmailVerificationRequestBy(
        {
          query: { id: addedRequest.id },
        },
        {
          expiresAt: new Date(newExpirationMs),
        }
      );

      expect(result.valid).toBe(true);
    });

    it("should update verification code", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({ userId: addedUser.id });
          return rest;
        })(),
      ];
      const addResult = await addEmailVerificationRequest(verificationData);
      const addedRequest = addResult.value[0];

      const updateParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: addedRequest.id },
      };

      const updateData = { code: "NEW456789" };
      const result = await updateEmailVerificationRequestBy(updateParam, updateData);

      expect(result.valid).toBe(true);
    });

    it("should update verification code to empty string", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId: addedUser.id,
            code: "INIT",
          });
          return rest;
        })(),
      ];
      const addResult = await addEmailVerificationRequest(verificationData);
      const addedRequest = addResult.value[0];

      const updateParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: addedRequest.id },
      };

      const updateData = { code: "" };
      const result = await updateEmailVerificationRequestBy(updateParam, updateData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("No data changed");
      expect(result.value[0].code).toBe("INIT");
    });

    it("should update email address", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({ userId: addedUser.id });
          return rest;
        })(),
      ];
      const addResult = await addEmailVerificationRequest(verificationData);
      const addedRequest = addResult.value[0];

      const updateParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: addedRequest.id },
      };

      const updateData = { email: "updated@test.com" };
      const result = await updateEmailVerificationRequestBy(updateParam, updateData);

      expect(result.valid).toBe(true);
    });
  });

  describe("generateQueryConditions", () => {
    it("should generate correct conditions for single field", () => {
      const param: HelperParam<NewEmailVerificationRequest> = {
        query: { userId: "test-user-id" },
      };

      const conditions = generateQueryConditions<NewEmailVerificationRequest>(param);

      expect(conditions).toEqual({ userId: "test-user-id" });
    });

    it("should generate correct conditions for multiple fields", () => {
      const param: HelperParam<NewEmailVerificationRequest> = {
        query: {
          userId: "test-user-id",
          email: "test@example.com",
          code: "CODE123",
        },
      };

      const conditions = generateQueryConditions<NewEmailVerificationRequest>(param);

      expect(conditions).toEqual({
        userId: "test-user-id",
        email: "test@example.com",
        code: "CODE123",
      });
    });

    it("should handle exclude_id option", () => {
      const conditions = generateQueryConditions<NewEmailVerificationRequest>({
        query: { userId: "test-user-id" },
        options: { exclude_id: "exclude-this-id" },
      });

      expect(conditions).toEqual({
        userId: "test-user-id",
        NOT: { id: "exclude-this-id" },
      });
    });

    it("should handle numeric expiresAt field", () => {
      const expiresAt = Date.now() + 15 * 60 * 1000;
      const conditions = generateQueryConditions<NewEmailVerificationRequest>({
        query: {
          expiresAt: expiresAt as unknown as Date,
        },
      });

      expect(conditions).toEqual({
        expiresAt,
      });
    });

    it("should ignore undefined fields", () => {
      const conditions = generateQueryConditions<NewEmailVerificationRequest>({
        query: {
          userId: "test-user-id",
          email: undefined,
          code: undefined,
          expiresAt: undefined,
        },
      });

      expect(conditions).toEqual({
        userId: "test-user-id",
      });
    });

    it("should handle all available query fields", () => {
      const expiresAt = Date.now() + 30 * 60 * 1000;
      const conditions = generateQueryConditions<NewEmailVerificationRequest>({
        query: {
          id: "test-id",
          userId: "test-user-id",
          email: "test@example.com",
          code: "TESTCODE123",
          expiresAt: expiresAt as unknown as Date,
        },
      });

      expect(conditions).toEqual({
        id: "test-id",
        userId: "test-user-id",
        email: "test@example.com",
        code: "TESTCODE123",
        expiresAt,
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle verification requests with very long codes", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const longCode = "A".repeat(500);
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId: addedUser.id,
            code: longCode,
          });
          return rest;
        })(),
      ];

      const result = await addEmailVerificationRequest(verificationData);

      expect(result.valid).toBe(true);
      expect(result.value[0].code).toBe(longCode);
    });

    it("should handle verification requests with special characters", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const specialCode = "CODE!@#$%^&*()_+-={}[]|\\:;\"'<>?,./";
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId: addedUser.id,
            code: specialCode,
            email: "special+chars@test-domain.co.uk",
          });
          return rest;
        })(),
      ];

      const result = await addEmailVerificationRequest(verificationData);

      expect(result.valid).toBe(true);
      expect(result.value[0].code).toBe(specialCode);
      expect(result.value[0].email).toBe("special+chars@test-domain.co.uk");
    });

    it("should handle simultaneous verification request operations", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const promises = Array.from({ length: 10 }, (_, i) => {
        const verificationData = [
          (() => {
            const { id: _, ...rest } = createEmailVerificationRequest({
              userId: addedUser.id,
              email: `concurrent${i}@example.com`,
              code: `CODE${i}`,
            });
            return rest;
          })(),
        ];
        return addEmailVerificationRequest(verificationData);
      });

      const results = await Promise.all(promises);

      expect(results.every((result) => result.valid)).toBe(true);
      expect(results.every((result) => result.value.length === 1)).toBe(true);
    });

    it("should find verification request with user relationship", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({ userId: addedUser.id });
          return rest;
        })(),
      ];

      const result = await addEmailVerificationRequest(verificationData);

      expect(result.valid).toBe(true);
      expect(result.value[0].userId).toBe(addedUser.id);

      // Verify the relationship exists by querying with user relation
      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { userId: addedUser.id },
        options: { with_user: true },
      };

      const searchResult = await getEmailVerificationRequestBy(searchParam);
      expect(searchResult.valid).toBe(true);
      expect(searchResult.value).toHaveLength(1);
      expect(searchResult.value[0] as any).toHaveProperty("user");
    });

    it("should handle expired verification requests", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const pastDateMs = Date.now() - 60 * 60 * 1000; // 1 hour ago
      const pastDate = new Date(pastDateMs);

      const result = await addEmailVerificationRequest([
        createEmailVerificationRequest({
          userId: addedUser.id,
          expiresAt: pastDate,
        }),
      ]);

      expect(result.valid).toBe(true);
      expect(result.value[0].expiresAt!).toStrictEqual(new Date(pastDateMs));
    });

    it("should handle verification request search with complex criteria", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const verificationData = [
        createEmailVerificationRequest({
          userId: addedUser.id,
          email: "test1@example.com",
          code: "CODE1",
        }),
        createEmailVerificationRequest({
          userId: addedUser.id,
          email: "test2@example.com",
          code: "CODE1",
        }),
        createEmailVerificationRequest({
          userId: addedUser.id,
          email: "test1@example.com",
          code: "CODE2",
        }),
      ].map((request) => {
        const { id: _, ...rest } = request;
        return rest;
      });
      await addEmailVerificationRequest(verificationData);

      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { userId: addedUser.id, email: "test1@example.com" },
        options: { limit: 1 },
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].email).toBe("test1@example.com");
    });

    it("should handle verification requests with international email addresses", async () => {
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const internationalEmail = "测试@例子.中国";
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId: addedUser.id,
            email: internationalEmail,
          });
          return rest;
        })(),
      ];

      const result = await addEmailVerificationRequest(verificationData);

      expect(result.valid).toBe(true);
      expect(result.value[0].email).toBe(internationalEmail);
    });
  });
});
