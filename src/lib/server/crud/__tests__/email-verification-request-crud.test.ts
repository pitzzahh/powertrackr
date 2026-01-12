import { describe, it, expect, beforeEach } from "vitest";
import {
  addEmailVerificationRequest,
  updateEmailVerificationRequestBy,
  getEmailVerificationRequestBy,
  getEmailVerificationRequests,
  getEmailVerificationRequestCountBy,
  mapNewEmailVerificationRequest_to_DTO,
  generateEmailVerificationRequestQueryConditions,
} from "../email-verification-request-crud";
import { createEmailVerificationRequest, createUser, resetSequence } from "./helpers/factories";
import { addUser } from "../user-crud";
import type { NewEmailVerificationRequest } from "$/types/email-verification-request";
import type { HelperParam } from "$/types/helper";

describe("Email Verification Request CRUD Operations", () => {
  beforeEach(() => {
    resetSequence();
  });

  describe("addEmailVerificationRequest", () => {
    it("should successfully add a single email verification request", async () => {
      // First create a user to reference
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser({ email: "verify@example.com" });
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes from now
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId,
            email: "verify@example.com",
            code: "VERIFY123456",
            expiresAt,
          });
          return rest;
        })(),
      ];

      const result = await addEmailVerificationRequest(verificationData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 email verification request(s) added");
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toHaveProperty("id");
      expect(result.value[0].userId).toBe(userId);
      expect(result.value[0].email).toBe("verify@example.com");
      expect(result.value[0].code).toBe("VERIFY123456");
      expect(result.value[0].expiresAt).toBe(expiresAt);
    });

    it("should successfully add multiple email verification requests", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const verificationData = Array.from({ length: 3 }, (_, i) =>
        createEmailVerificationRequest({
          userId,
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
      expect(result.value.every((request) => request.id)).toBe(true);
      expect(result.value.every((request) => request.userId === userId)).toBe(true);
    });

    it("should handle empty array input", async () => {
      const result = await addEmailVerificationRequest([]);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("0 email verification request(s) added");
      expect(result.value).toHaveLength(0);
    });

    it("should handle verification request with far future expiration", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const farFuture = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId,
            expiresAt: farFuture,
          });
          return rest;
        })(),
      ];

      const result = await addEmailVerificationRequest(verificationData);

      expect(result.valid).toBe(true);
      expect(result.value[0].expiresAt).toBe(farFuture);
    });

    it("should handle verification request with special characters in email", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const specialEmail = "test+special.chars@sub-domain.example.com";
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId,
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
      const addResult = await addEmailVerificationRequest(verificationData);
      const addedRequest = addResult.value[0];

      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: addedRequest.id },
        options: {},
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 email verification request(s) found");
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe(addedRequest.id);
    });

    it("should find verification request by user ID", async () => {
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
        options: {},
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].userId).toBe(userId);
    });

    it("should find verification request by email", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const testEmail = "find@example.com";
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({ userId, email: testEmail });
          return rest;
        })(),
      ];
      await addEmailVerificationRequest(verificationData);

      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { email: testEmail },
        options: {},
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].email).toBe(testEmail);
    });

    it("should find verification request by code", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const testCode = "FINDME123";
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({ userId, code: testCode });
          return rest;
        })(),
      ];
      await addEmailVerificationRequest(verificationData);

      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { code: testCode },
        options: {},
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].code).toBe(testCode);
    });

    it("should find verification request by expiration time", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const testExpiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId,
            expiresAt: testExpiresAt,
          });
          return rest;
        })(),
      ];
      await addEmailVerificationRequest(verificationData);

      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { expiresAt: testExpiresAt },
        options: {},
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].expiresAt).toBe(testExpiresAt);
    });

    it("should return empty result when verification request not found", async () => {
      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: "nonexistent-id" },
        options: {},
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("id: nonexistent-id not found");
      expect(result.value).toHaveLength(0);
    });

    it("should apply limit option", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const verificationData = Array.from({ length: 5 }, (_, i) =>
        createEmailVerificationRequest({
          userId,
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
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const verificationData = Array.from({ length: 5 }, (_, i) =>
        createEmailVerificationRequest({
          userId,
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
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const verificationData = Array.from({ length: 3 }, (_, i) =>
        createEmailVerificationRequest({
          userId,
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
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId,
            email: "old@example.com",
            code: "OLDCODE123",
          });
          return rest;
        })(),
      ];
      const addResult = await addEmailVerificationRequest(verificationData);
      const addedRequest = addResult.value[0];

      const updateParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: addedRequest.id },
        options: {},
      };

      const newExpiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
      const updateData = {
        email: "new@example.com",
        code: "NEWCODE456",
        expiresAt: newExpiresAt,
      };
      const result = await updateEmailVerificationRequestBy(updateParam, updateData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 email verification request(s) updated");
      expect(result.value).toHaveLength(1);
      expect(result.value[0].email).toBe("new@example.com");
      expect(result.value[0].code).toBe("NEWCODE456");
      expect(result.value[0].expiresAt).toBe(newExpiresAt);
    });

    it("should handle no data changed scenario", async () => {
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
          const { id: _, ...rest } = createEmailVerificationRequest({ userId, code: "SAME123" });
          return rest;
        })(),
      ];
      const addResult = await addEmailVerificationRequest(verificationData);
      const addedRequest = addResult.value[0];

      const updateParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: addedRequest.id },
        options: {},
      };

      const updateData = { code: "SAME123" };
      const result = await updateEmailVerificationRequestBy(updateParam, updateData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("No data changed");
      expect(result.value).toHaveLength(1);
    });

    it("should handle nonexistent verification request update", async () => {
      const updateParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: "nonexistent-id" },
        options: {},
      };

      const updateData = { code: "NEWCODE" };
      const result = await updateEmailVerificationRequestBy(updateParam, updateData);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("id: nonexistent-id not found");
      expect(result.value).toHaveLength(0);
    });

    it("should update expiration time", async () => {
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
      const addResult = await addEmailVerificationRequest(verificationData);
      const addedRequest = addResult.value[0];

      const newExpiration = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
      const updateParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: addedRequest.id },
        options: {},
      };

      const updateData = { expiresAt: newExpiration };
      const result = await updateEmailVerificationRequestBy(updateParam, updateData);

      expect(result.valid).toBe(true);
      expect(result.value[0].expiresAt).toBe(newExpiration);
    });

    it("should update verification code", async () => {
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
          const { id: _, ...rest } = createEmailVerificationRequest({ userId, code: "OLD123" });
          return rest;
        })(),
      ];
      const addResult = await addEmailVerificationRequest(verificationData);
      const addedRequest = addResult.value[0];

      const updateParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: addedRequest.id },
        options: {},
      };

      const updateData = { code: "NEW456789" };
      const result = await updateEmailVerificationRequestBy(updateParam, updateData);

      expect(result.valid).toBe(true);
      expect(result.value[0].code).toBe("NEW456789");
    });

    it("should update email address", async () => {
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
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId,
            email: "old@test.com",
          });
          return rest;
        })(),
      ];
      const addResult = await addEmailVerificationRequest(verificationData);
      const addedRequest = addResult.value[0];

      const updateParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: addedRequest.id },
        options: {},
      };

      const updateData = { email: "updated@test.com" };
      const result = await updateEmailVerificationRequestBy(updateParam, updateData);

      expect(result.valid).toBe(true);
      expect(result.value[0].email).toBe("updated@test.com");
    });
  });

  describe("getEmailVerificationRequestCountBy", () => {
    it("should return correct count for existing verification requests", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const verificationData = Array.from({ length: 5 }, (_, i) =>
        createEmailVerificationRequest({
          userId,
          email: `test${i}@example.com`,
        })
      ).map((request) => {
        const { id: _, ...rest } = request;
        return rest;
      });
      await addEmailVerificationRequest(verificationData);

      const countParam: HelperParam<NewEmailVerificationRequest> = {
        query: {},
        options: {},
      };

      const result = await getEmailVerificationRequestCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
      expect(result.message).toBe("Email verification request(s) count is 5");
    });

    it("should return zero count when no verification requests match", async () => {
      const countParam: HelperParam<NewEmailVerificationRequest> = {
        query: { userId: "nonexistent-user-id" },
        options: {},
      };

      const result = await getEmailVerificationRequestCountBy(countParam);

      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
      expect(result.message).toContain("userId: nonexistent-user-id not found");
    });

    it("should count verification requests with specific criteria", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const verificationData = [
        createEmailVerificationRequest({ userId, email: "test1@example.com" }),
        createEmailVerificationRequest({ userId, email: "test1@example.com" }),
        createEmailVerificationRequest({ userId, email: "test2@example.com" }),
      ].map((request) => {
        const { id: _, ...rest } = request;
        return rest;
      });
      await addEmailVerificationRequest(verificationData);

      const countParam: HelperParam<NewEmailVerificationRequest> = {
        query: { email: "test1@example.com" },
        options: {},
      };

      const result = await getEmailVerificationRequestCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(2);
    });

    it("should apply limit when searching by specific fields", async () => {
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
      const addResult = await addEmailVerificationRequest(verificationData);
      const addedRequest = addResult.value[0];

      const countParam: HelperParam<NewEmailVerificationRequest> = {
        query: { id: addedRequest.id },
        options: {},
      };

      const result = await getEmailVerificationRequestCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(1);
    });
  });

  describe("getEmailVerificationRequests", () => {
    it("should return DTO format verification requests", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const expiresAt = Date.now() + 30 * 60 * 1000;
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId,
            email: "dto@example.com",
            code: "DTO123456",
            expiresAt,
          });
          return rest;
        })(),
      ];
      await addEmailVerificationRequest(verificationData);

      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { userId },
        options: {},
      };

      const result = await getEmailVerificationRequests(searchParam);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("userId");
      expect(result[0]).toHaveProperty("email");
      expect(result[0]).toHaveProperty("code");
      expect(result[0]).toHaveProperty("expiresAt");
      expect(result[0].userId).toBe(userId);
      expect(result[0].email).toBe("dto@example.com");
      expect(result[0].code).toBe("DTO123456");
      expect(result[0].expiresAt).toBe(expiresAt);
    });

    it("should return empty array when no verification requests found", async () => {
      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { userId: "nonexistent-user-id" },
        options: {},
      };

      const result = await getEmailVerificationRequests(searchParam);

      expect(result).toHaveLength(0);
    });
  });

  describe("mapNewEmailVerificationRequest_to_DTO", () => {
    it("should correctly map verification request data to DTO format", async () => {
      const expiresAt = Date.now() + 45 * 60 * 1000;
      const verificationData = createEmailVerificationRequest({
        userId: "test-user-id",
        email: "map@example.com",
        code: "MAP123456",
        expiresAt,
      });

      const result = await mapNewEmailVerificationRequest_to_DTO([verificationData]);

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe("test-user-id");
      expect(result[0].email).toBe("map@example.com");
      expect(result[0].code).toBe("MAP123456");
      expect(result[0].expiresAt).toBe(expiresAt);
    });

    it("should handle verification request with user relationship", async () => {
      const userData = { id: "test-user", name: "Test User", email: "test@example.com" };
      const verificationData = {
        ...createEmailVerificationRequest(),
        user: userData,
      };

      const result = await mapNewEmailVerificationRequest_to_DTO([verificationData]);

      expect(result).toHaveLength(1);
      expect(result[0] as any).toHaveProperty("user");
      expect((result[0] as any).user).toEqual(userData);
    });

    it("should handle verification request with missing values", async () => {
      const verificationData = {
        id: undefined,
        userId: undefined,
        email: undefined,
        code: undefined,
        expiresAt: undefined,
      };

      const result = await mapNewEmailVerificationRequest_to_DTO([verificationData]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("");
      expect(result[0].userId).toBe("");
      expect(result[0].email).toBe("");
      expect(result[0].code).toBe("");
      expect(result[0].expiresAt).toBe(0);
    });

    it("should handle empty array input", async () => {
      const result = await mapNewEmailVerificationRequest_to_DTO([]);

      expect(result).toHaveLength(0);
    });

    it("should handle multiple verification requests", async () => {
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
      const param: HelperParam<NewEmailVerificationRequest> = {
        query: { userId: "test-user-id" },
        options: {},
      };

      const conditions = generateEmailVerificationRequestQueryConditions(param);

      expect(conditions).toEqual({ userId: "test-user-id" });
    });

    it("should generate correct conditions for multiple fields", () => {
      const param: HelperParam<NewEmailVerificationRequest> = {
        query: {
          userId: "test-user-id",
          email: "test@example.com",
          code: "CODE123",
        },
        options: {},
      };

      const conditions = generateEmailVerificationRequestQueryConditions(param);

      expect(conditions).toEqual({
        userId: "test-user-id",
        email: "test@example.com",
        code: "CODE123",
      });
    });

    it("should handle exclude_id option", () => {
      const param: HelperParam<NewEmailVerificationRequest> = {
        query: { userId: "test-user-id" },
        options: { exclude_id: "exclude-this-id" },
      };

      const conditions = generateEmailVerificationRequestQueryConditions(param);

      expect(conditions).toEqual({
        userId: "test-user-id",
        NOT: { id: "exclude-this-id" },
      });
    });

    it("should handle numeric expiresAt field", () => {
      const expiresAt = Date.now() + 15 * 60 * 1000;
      const param: HelperParam<NewEmailVerificationRequest> = {
        query: {
          expiresAt,
        },
        options: {},
      };

      const conditions = generateEmailVerificationRequestQueryConditions(param);

      expect(conditions).toEqual({
        expiresAt,
      });
    });

    it("should ignore undefined fields", () => {
      const param: HelperParam<NewEmailVerificationRequest> = {
        query: {
          userId: "test-user-id",
          email: undefined,
          code: undefined,
          expiresAt: undefined,
        },
        options: {},
      };

      const conditions = generateEmailVerificationRequestQueryConditions(param);

      expect(conditions).toEqual({
        userId: "test-user-id",
      });
    });

    it("should handle all available query fields", () => {
      const expiresAt = Date.now() + 30 * 60 * 1000;
      const param: HelperParam<NewEmailVerificationRequest> = {
        query: {
          id: "test-id",
          userId: "test-user-id",
          email: "test@example.com",
          code: "TESTCODE123",
          expiresAt,
        },
        options: {},
      };

      const conditions = generateEmailVerificationRequestQueryConditions(param);

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
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const longCode = "A".repeat(500);
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId,
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
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const specialCode = "CODE!@#$%^&*()_+-={}[]|\\:;\"'<>?,./";
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId,
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
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const promises = Array.from({ length: 10 }, (_, i) => {
        const verificationData = [
          (() => {
            const { id: _, ...rest } = createEmailVerificationRequest({
              userId,
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

    it("should handle verification request with foreign key relationships", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser({ email: "relationship-test@example.com" });
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

      const result = await addEmailVerificationRequest(verificationData);

      expect(result.valid).toBe(true);
      expect(result.value[0].userId).toBe(userId);

      // Verify the relationship exists by querying with user relation
      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { userId },
        options: { with_user: true },
      };

      const searchResult = await getEmailVerificationRequestBy(searchParam);
      expect(searchResult.valid).toBe(true);
      expect(searchResult.value).toHaveLength(1);
      expect(searchResult.value[0] as any).toHaveProperty("user");
    });

    it("should handle expired verification requests", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const pastDate = Date.now() - 60 * 60 * 1000; // 1 hour ago
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId,
            expiresAt: pastDate,
          });
          return rest;
        })(),
      ];

      const result = await addEmailVerificationRequest(verificationData);

      expect(result.valid).toBe(true);
      expect(result.value[0].expiresAt).toBe(pastDate);
    });

    it("should handle verification request search with complex criteria", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const verificationData = [
        createEmailVerificationRequest({ userId, email: "test1@example.com", code: "CODE1" }),
        createEmailVerificationRequest({ userId, email: "test2@example.com", code: "CODE1" }),
        createEmailVerificationRequest({ userId, email: "test1@example.com", code: "CODE2" }),
      ].map((request) => {
        const { id: _, ...rest } = request;
        return rest;
      });
      await addEmailVerificationRequest(verificationData);

      const searchParam: HelperParam<NewEmailVerificationRequest> = {
        query: { userId, email: "test1@example.com" },
        options: { limit: 1 },
      };

      const result = await getEmailVerificationRequestBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].email).toBe("test1@example.com");
    });

    it("should handle verification requests with international email addresses", async () => {
      const userData = [
        (() => {
          const { id: _, ...rest } = createUser();
          return rest;
        })(),
      ];
      const userResult = await addUser(userData);
      const userId = userResult.value[0].id;

      const internationalEmail = "测试@例子.中国";
      const verificationData = [
        (() => {
          const { id: _, ...rest } = createEmailVerificationRequest({
            userId,
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
