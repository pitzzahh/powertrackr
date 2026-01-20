import { describe, it, expect, beforeEach } from "vitest";
import {
  addEmailVerificationRequest,
  updateEmailVerificationRequestBy,
  getEmailVerificationRequestBy,
  getEmailVerificationRequests,
  getEmailVerificationRequestCountBy,
  deleteEmailVerificationRequestBy,
  mapNewEmailVerificationRequest_to_DTO,
  generateEmailVerificationRequestQueryConditions,
} from "../email-verification-request-crud";
import { createEmailVerificationRequest, createUser, resetSequence } from "./helpers/factories";
import { addUser } from "../user-crud";
import type { NewEmailVerificationRequest } from "$/types/email-verification-request";
import type { HelperParam } from "$/server/types/helper";

describe("Email Verification Request CRUD Operations", () => {
  beforeEach(() => {
    resetSequence();
  });

  describe("addEmailVerificationRequest", () => {
    it("should successfully add a single email verification request", async () => {
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
      const result = await addEmailVerificationRequest([]);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("0 email verification request(s) added");
      expect(result.value).toHaveLength(0);
    });

    it("should handle verification request with far future expiration", async () => {
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: "nonexistent-id" },
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("id: nonexistent-id not found");
      expect(result.value).toHaveLength(0);
    });

    it("should apply limit option", async () => {
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
      const updateParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: "nonexistent-id" },
      };

      const updateData = { code: "NEWCODE" };
      const result = await updateEmailVerificationRequestBy(updateParam, updateData);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("id: nonexistent-id not found");
    });

    it("should update expiration time", async () => {
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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

  describe("getEmailVerificationRequestCountBy", () => {
    it("should return correct count for existing verification requests", async () => {
      if (process.env.CI === "true") return;
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

      const countParam: HelperParam<NewEmailVerificationRequest> = {
        query: {},
      };

      const result = await getEmailVerificationRequestCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
      expect(result.message).toBe("Email verification request(s) count is 5");
    });

    it("should return zero count when no verification requests match", async () => {
      if (process.env.CI === "true") return;
      const countParam: HelperParam<NewEmailVerificationRequest> = {
        query: { userId: "nonexistent-user-id" },
      };

      const result = await getEmailVerificationRequestCountBy(countParam);

      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
      expect(result.message).toContain("userId: nonexistent-user-id not found");
    });

    it("should count verification requests with specific criteria", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const verificationData = [
        createEmailVerificationRequest({ userId: addedUser.id, email: "test1@example.com" }),
        createEmailVerificationRequest({ userId: addedUser.id, email: "test1@example.com" }),
        createEmailVerificationRequest({ userId: addedUser.id, email: "test2@example.com" }),
      ].map((request) => {
        const { id: _, ...rest } = request;
        return rest;
      });
      await addEmailVerificationRequest(verificationData);

      const countParam: HelperParam<NewEmailVerificationRequest> = {
        query: { email: "test1@example.com" },
      };

      const result = await getEmailVerificationRequestCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(2);
    });

    it("should apply limit when searching by specific fields", async () => {
      if (process.env.CI === "true") return;
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

      const countParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: addedRequest.id },
      };

      const result = await getEmailVerificationRequestCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(1);
    });
  });

  describe("getEmailVerificationRequests", () => {
    it("should return DTO format verification requests", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const expiresAtMs = Date.now() + 30 * 60 * 1000;
      await addEmailVerificationRequest([
        createEmailVerificationRequest({
          userId: addedUser.id,
          email: "dto@example.com",
          code: "DTO123456",
          expiresAt: new Date(expiresAtMs),
        }),
      ]);

      const result = await getEmailVerificationRequests({
        query: { userId: addedUser.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("userId");
      expect(result[0]).toHaveProperty("email");
      expect(result[0]).toHaveProperty("code");
      expect(result[0]).toHaveProperty("expiresAt");
      expect(result[0].userId).toBe(addedUser.id);
      expect(result[0].email).toBe("dto@example.com");
      expect(result[0].code).toBe("DTO123456");
      expect(result[0].expiresAt!).toStrictEqual(new Date(expiresAtMs));
    });

    it("should return empty array when no verification requests found", async () => {
      if (process.env.CI === "true") return;
      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { userId: "nonexistent-user-id" },
      };

      const result = await getEmailVerificationRequests(searchParam);

      expect(result).toHaveLength(0);
    });
  });

  describe("mapNewEmailVerificationRequest_to_DTO", () => {
    it("should correctly map verification request data to DTO format", async () => {
      if (process.env.CI === "true") return;
      const expiresAtMs = Date.now() + 45 * 60 * 1000;

      const result = await mapNewEmailVerificationRequest_to_DTO([
        createEmailVerificationRequest({
          userId: "test-user-id",
          email: "map@example.com",
          code: "MAP123456",
          expiresAt: new Date(expiresAtMs),
        }),
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe("test-user-id");
      expect(result[0].email).toBe("map@example.com");
      expect(result[0].code).toBe("MAP123456");
      expect(result[0].expiresAt!).toStrictEqual(new Date(expiresAtMs));
    });

    it("should handle verification request with user relationship", async () => {
      if (process.env.CI === "true") return;
      const userData = { id: "test-user", name: "Test User", email: "test@example.com" };
      const result = await mapNewEmailVerificationRequest_to_DTO([
        {
          ...createEmailVerificationRequest(),
          user: userData,
        },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0] as any).toHaveProperty("user");
      expect((result[0] as any).user).toEqual(userData);
    });

    it("should handle verification request with missing values", async () => {
      if (process.env.CI === "true") return;
      const result = await mapNewEmailVerificationRequest_to_DTO([
        {
          id: undefined,
          userId: undefined,
          email: undefined,
          code: undefined,
          expiresAt: undefined,
        },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(undefined);
      expect(result[0].userId).toBe(undefined);
      expect(result[0].email).toBe(undefined);
      expect(result[0].code).toBe(undefined);
      expect(result[0].expiresAt).toBe(undefined);
    });

    it("should handle empty array input", async () => {
      if (process.env.CI === "true") return;
      const result = await mapNewEmailVerificationRequest_to_DTO([]);

      expect(result).toHaveLength(0);
    });

    it("should handle multiple verification requests", async () => {
      if (process.env.CI === "true") return;
      const verificationData = [
        createEmailVerificationRequest({ email: "test1@example.com", code: "CODE1" }),
        createEmailVerificationRequest({ email: "test2@example.com", code: "CODE2" }),
        createEmailVerificationRequest({ email: "test3@example.com", code: "CODE3" }),
      ];

      const result = await mapNewEmailVerificationRequest_to_DTO(verificationData);

      expect(result).toHaveLength(3);
      expect(result[0].email).toBe("test1@example.com");
      expect(result[1].email).toBe("test2@example.com");
      expect(result[2].email).toBe("test3@example.com");
      expect(result[0].code).toBe("CODE1");
      expect(result[1].code).toBe("CODE2");
      expect(result[2].code).toBe("CODE3");
    });
  });

  describe("generateEmailVerificationRequestQueryConditions", () => {
    it("should generate correct conditions for single field", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewEmailVerificationRequest> = {
        query: { userId: "test-user-id" },
      };

      const conditions = generateEmailVerificationRequestQueryConditions(param);

      expect(conditions).toEqual({ userId: "test-user-id" });
    });

    it("should generate correct conditions for multiple fields", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewEmailVerificationRequest> = {
        query: {
          userId: "test-user-id",
          email: "test@example.com",
          code: "CODE123",
        },
      };

      const conditions = generateEmailVerificationRequestQueryConditions(param);

      expect(conditions).toEqual({
        userId: "test-user-id",
        email: "test@example.com",
        code: "CODE123",
      });
    });

    it("should handle exclude_id option", () => {
      if (process.env.CI === "true") return;
      const conditions = generateEmailVerificationRequestQueryConditions({
        query: { userId: "test-user-id" },
        options: { exclude_id: "exclude-this-id" },
      });

      expect(conditions).toEqual({
        userId: "test-user-id",
        NOT: { id: "exclude-this-id" },
      });
    });

    it("should handle numeric expiresAt field", () => {
      if (process.env.CI === "true") return;
      const expiresAt = Date.now() + 15 * 60 * 1000;
      const conditions = generateEmailVerificationRequestQueryConditions({
        query: {
          expiresAt: expiresAt as unknown as Date,
        },
      });

      expect(conditions).toEqual({
        expiresAt,
      });
    });

    it("should ignore undefined fields", () => {
      if (process.env.CI === "true") return;
      const conditions = generateEmailVerificationRequestQueryConditions({
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
      if (process.env.CI === "true") return;
      const expiresAt = Date.now() + 30 * 60 * 1000;
      const conditions = generateEmailVerificationRequestQueryConditions({
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

  describe("deleteEmailVerificationRequestBy", () => {
    it("should successfully delete verification request by ID", async () => {
      if (process.env.CI === "true") return;
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

      const deleteParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: addedRequest.id },
      };

      const result = await deleteEmailVerificationRequestBy(deleteParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(1);
      expect(result.message).toContain("1 email verification request(s) deleted");

      // Verify deletion
      const fetchResult = await getEmailVerificationRequestBy({
        query: { id: addedRequest.id },
      });
      expect(fetchResult.valid).toBe(false);
    });

    it("should successfully delete multiple verification requests by userId", async () => {
      if (process.env.CI === "true") return;
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

      const { valid: validRequests, value: addedRequests } =
        await addEmailVerificationRequest(verificationData);

      expect(validRequests).toBe(true);
      expect(addedRequests).toHaveLength(3);

      const deleteParam: HelperParam<NewEmailVerificationRequest> = {
        query: { userId: addedUser.id },
      };

      const result = await deleteEmailVerificationRequestBy(deleteParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(3);
      expect(result.message).toContain("3 email verification request(s) deleted");

      // Verify deletion
      const countResult = await getEmailVerificationRequestCountBy({
        query: { userId: addedUser.id },
      });
      expect(countResult.value).toBe(0);
    });

    it("should handle nonexistent verification request deletion", async () => {
      if (process.env.CI === "true") return;

      const deleteParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: "non-existent-id" },
      };

      const result = await deleteEmailVerificationRequestBy(deleteParam);

      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
      expect(result.message).toContain("not deleted");
    });

    it("should handle no conditions provided", async () => {
      if (process.env.CI === "true") return;

      const deleteParam: HelperParam<NewEmailVerificationRequest> = {
        query: {},
      };

      const result = await deleteEmailVerificationRequestBy(deleteParam);

      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
      expect(result.message).toBe("No conditions provided for deletion");
    });

    it("should delete verification requests with multiple conditions", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser()]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const testEmail = "multi@example.com";
      const testCode = "MULTI123";

      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId: addedUser.id,
            email: testEmail,
            code: testCode,
          });
          return rest;
        })(),
      ];
      const addResult = await addEmailVerificationRequest(verificationData);
      const addedRequest = addResult.value[0];

      const deleteParam: HelperParam<NewEmailVerificationRequest> = {
        query: { userId: addedUser.id, email: testEmail },
      };

      const result = await deleteEmailVerificationRequestBy(deleteParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(1);
      expect(result.message).toContain("1 email verification request(s) deleted");

      // Verify deletion
      const fetchResult = await getEmailVerificationRequestBy({
        query: { id: addedRequest.id },
      });
      expect(fetchResult.valid).toBe(false);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle verification requests with very long codes", async () => {
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
      if (process.env.CI === "true") return;
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
