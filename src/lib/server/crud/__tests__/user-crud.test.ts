import { describe, it, expect, beforeEach } from "vitest";
import {
  addUser,
  updateUserBy,
  getUserBy,
  getUsers,
  getUserCountBy,
  deleteUserBy,
  mapNewUser_to_DTO,
  generateUserQueryConditions,
} from "../user-crud";
import { db } from "$/server/db";
import { createUser, createUsers, resetSequence } from "./helpers/factories";
import type { NewUser } from "$/types/user";
import type { HelperParam } from "$/server/types/helper";

describe("User CRUD Operations", () => {
  beforeEach(() => {
    resetSequence();
  });

  describe("addUser", () => {
    it("should successfully add a single user", async () => {
      if (process.env.CI === "true") return;
      const { id: _, ...userDataWithoutId } = createUser({
        email: "test@example.com",
        name: "Test User",
      });
      const userData = [userDataWithoutId];

      const {
        valid,
        value: [addedUser],
      } = await addUser(userData);

      expect(valid).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedUser).toHaveProperty("id");
      expect(addedUser.email).toBe("test@example.com");
      expect(addedUser.name).toBe("Test User");
    });

    it("should successfully add multiple users", async () => {
      if (process.env.CI === "true") return;
      const usersData = createUsers(3).map((user) => {
        const { id: _, ...userWithoutId } = user;
        return userWithoutId;
      });

      const { valid, value: addedUsers } = await addUser(usersData);

      expect(valid).toBe(true);
      expect(addedUsers).toHaveLength(3);
      expect(addedUsers.every((user) => user.id)).toBe(true);
    });

    it("should handle empty array input", async () => {
      if (process.env.CI === "true") return;
      const { valid, value } = await addUser([]);

      expect(valid).toBe(true);
      expect(value).toHaveLength(0);
    });

    it("should handle users with all optional fields", async () => {
      if (process.env.CI === "true") return;
      const {
        valid,
        value: [addedUser],
      } = await addUser([
        {
          name: "Minimal User",
          email: "minimal@example.com",
          emailVerified: false,
          registeredTwoFactor: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      expect(valid).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedUser.name).toBe("Minimal User");
      expect(addedUser.email).toBe("minimal@example.com");
      expect(addedUser.githubId).toBeNull();
      expect(addedUser.image).toBeNull();
    });
  });

  describe("getUserBy", () => {
    it("should find user by ID", async () => {
      if (process.env.CI === "true") return;
      // First add a user
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([
        createUser({
          email: "findme@example.com",
          name: "Find Me",
        }),
      ]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const searchParam: HelperParam<NewUser> = {
        query: { id: addedUser.id },
      };

      const result = await getUserBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 user(s) found");
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe(addedUser.id);
      expect(result.value[0].email).toBe("findme@example.com");
    });

    it("should find user by email", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([
        createUser({
          email: "unique@example.com",
          name: "Unique User",
        }),
      ]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const searchParam: HelperParam<NewUser> = {
        query: { email: "unique@example.com" },
      };

      const result = await getUserBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].email).toBe("unique@example.com");
    });

    it("should find user by githubId", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser({ githubId: 12345, name: "GitHub User" })]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const searchParam: HelperParam<NewUser> = {
        query: { githubId: 12345 },
      };

      const result = await getUserBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].githubId).toBe(12345);
    });

    it("should return empty result when user not found", async () => {
      if (process.env.CI === "true") return;
      const searchParam: HelperParam<NewUser> = {
        query: { id: "nonexistent-id" },
      };

      const result = await getUserBy(searchParam);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("id: nonexistent-id not found");
      expect(result.value).toHaveLength(0);
    });

    it("should apply limit option", async () => {
      if (process.env.CI === "true") return;
      const usersData = createUsers(5).map((user) => {
        const { id: _, ...userWithoutId } = user;
        return userWithoutId;
      });
      const { valid: validUsers } = await addUser(usersData);

      expect(validUsers).toBe(true);

      const searchParam: HelperParam<NewUser> = {
        query: {},
        options: { limit: 3 },
      };

      const result = await getUserBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(3);
    });

    it("should apply offset option", async () => {
      if (process.env.CI === "true") return;
      const usersData = createUsers(5).map((user) => {
        const { id: _, ...userWithoutId } = user;
        return userWithoutId;
      });
      const { valid: validUsers } = await addUser(usersData);

      expect(validUsers).toBe(true);

      const searchParam: HelperParam<NewUser> = {
        query: {},
        options: { offset: 2, limit: 2 },
      };

      const result = await getUserBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(2);
    });

    it("should apply fields selection", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([
        createUser({
          email: "fields@example.com",
          name: "Fields Test",
        }),
      ]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const searchParam: HelperParam<NewUser> = {
        query: { email: "fields@example.com" },
        options: { fields: ["id", "email", "name"] as (keyof NewUser)[] },
      };

      const result = await getUserBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toHaveProperty("id");
      expect(result.value[0]).toHaveProperty("email");
      expect(result.value[0]).toHaveProperty("name");
    });

    it("should exclude specified ID", async () => {
      if (process.env.CI === "true") return;
      const usersData = createUsers(3).map((user) => {
        const { id: _, ...userWithoutId } = user;
        return userWithoutId;
      });
      const { valid: validUsers, value: addedUsers } = await addUser(usersData);

      expect(validUsers).toBe(true);
      expect(addedUsers).toHaveLength(3);

      const excludeId = addedUsers[1].id;

      const searchParam: HelperParam<NewUser> = {
        query: {},
        options: { exclude_id: excludeId },
      };

      const result = await getUserBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(2);
      expect(result.value.every((user) => user.id !== excludeId)).toBe(true);
    });
  });

  describe("updateUserBy", () => {
    it("should successfully update user by ID", async () => {
      if (process.env.CI === "true") return;
      // First add a user
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([
        createUser({
          email: "update@example.com",
          name: "Update Me",
        }),
      ]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const updateParam: HelperParam<NewUser> = {
        query: { id: addedUser.id },
      };

      const updateData = { name: "Updated Name", emailVerified: true };
      const result = await updateUserBy(updateParam, updateData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 user(s) updated");
      expect(result.value).toHaveLength(1);
      expect(result.value[0].name).toBe("Updated Name");
      expect(result.value[0].emailVerified).toBe(true);
    });

    it("should handle no data changed scenario", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser({ name: "Same Name" })]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const updateParam: HelperParam<NewUser> = {
        query: { id: addedUser.id },
      };

      const updateData = { name: "Same Name" };
      const result = await updateUserBy(updateParam, updateData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("No data changed");
      expect(result.value).toHaveLength(1);
    });

    it("should handle nonexistent user update", async () => {
      if (process.env.CI === "true") return;
      const updateParam: HelperParam<NewUser> = {
        query: { id: "nonexistent-id" },
      };

      const updateData = { name: "New Name" };
      const result = await updateUserBy(updateParam, updateData);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("id: nonexistent-id not found");
      expect(result.value).toHaveLength(0);
    });

    it("should update multiple fields at once", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser({ email: "multi@example.com" })]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const updateParam: HelperParam<NewUser> = {
        query: { id: addedUser.id },
      };

      const updateData = {
        name: "Multi Update",
        emailVerified: true,
        registeredTwoFactor: true,
        image: "new-image-url",
      };
      const result = await updateUserBy(updateParam, updateData);

      expect(result.valid).toBe(true);
      expect(result.value[0].name).toBe("Multi Update");
      expect(result.value[0].emailVerified).toBe(true);
      expect(result.value[0].registeredTwoFactor).toBe(true);
      expect(result.value[0].image).toBe("new-image-url");
    });
  });

  describe("getUserCountBy", () => {
    it("should return correct count for existing users", async () => {
      if (process.env.CI === "true") return;
      const { valid: validUsers } = await addUser(
        createUsers(5).map((user) => {
          const { id: _, ...userWithoutId } = user;
          return userWithoutId;
        })
      );

      expect(validUsers).toBe(true);

      const result = await getUserCountBy({
        query: {},
      });

      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
      expect(result.message).toBe("User(s) count is 5");
    });

    it("should return zero count when no users match", async () => {
      if (process.env.CI === "true") return;
      const countParam: HelperParam<NewUser> = {
        query: { email: "nonexistent@example.com" },
      };

      const result = await getUserCountBy(countParam);

      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
      expect(result.message).toContain("email: nonexistent@example.com not found");
    });

    it("should count users with specific criteria", async () => {
      if (process.env.CI === "true") return;
      const usersData = [
        createUser({ emailVerified: true }),
        createUser({ emailVerified: true }),
        createUser({ emailVerified: false }),
      ].map((user) => {
        const { id: _, ...userWithoutId } = user;
        return userWithoutId;
      });
      const { valid: validUsers } = await addUser(usersData);

      expect(validUsers).toBe(true);

      const countParam: HelperParam<NewUser> = {
        query: { emailVerified: true },
      };

      const result = await getUserCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(2);
    });
  });

  describe("getUsers", () => {
    it("should return DTO format users", async () => {
      if (process.env.CI === "true") return;
      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([
        createUser({
          email: "dto@example.com",
          name: "DTO User",
        }),
      ]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const searchParam: HelperParam<NewUser> = {
        query: { email: "dto@example.com" },
      };

      const result = await getUsers(searchParam);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("githubId");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("email");
      expect(result[0]).toHaveProperty("emailVerified");
      expect(result[0]).toHaveProperty("registeredTwoFactor");
      expect(result[0]).toHaveProperty("image");
      expect(result[0]).toHaveProperty("createdAt");
      expect(result[0]).toHaveProperty("updatedAt");
      expect(result[0].email).toBe("dto@example.com");
    });

    it("should return empty array when no users found", async () => {
      if (process.env.CI === "true") return;
      const searchParam: HelperParam<NewUser> = {
        query: { email: "nonexistent@example.com" },
      };

      const result = await getUsers(searchParam);

      expect(result).toHaveLength(0);
    });
  });

  describe("mapNewUser_to_DTO", () => {
    it("should correctly map user data to DTO format", async () => {
      if (process.env.CI === "true") return;
      const userData = createUser({
        email: "map@example.com",
        name: "Map User",
        githubId: 12345,
        emailVerified: true,
        image: "profile.jpg",
      });

      const result = mapNewUser_to_DTO([userData]);

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("map@example.com");
      expect(result[0].name).toBe("Map User");
      expect(result[0].githubId).toBe(12345);
      expect(result[0].emailVerified).toBe(true);
      expect(result[0].image).toBe("profile.jpg");
      expect(result[0].registeredTwoFactor).toBe(false);
    });

    it("should handle users with null/undefined values", () => {
      if (process.env.CI === "true") return;
      const userData = createUser({
        githubId: null,
        image: null,
        totpKey: null,
        recoveryCode: null,
      });

      const result = mapNewUser_to_DTO([userData]);

      expect(result).toHaveLength(1);
      expect(result[0].githubId).toBeNull();
      expect(result[0].image).toBeNull();
    });

    it("should handle empty array input", () => {
      if (process.env.CI === "true") return;
      const result = mapNewUser_to_DTO([]);

      expect(result).toHaveLength(0);
    });
  });

  describe("generateUserQueryConditions", () => {
    it("should generate correct conditions for single field", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewUser> = {
        query: { email: "test@example.com" },
      };

      const conditions = generateUserQueryConditions(param);

      expect(conditions).toEqual({ email: "test@example.com" });
    });

    it("should generate correct conditions for multiple fields", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewUser> = {
        query: {
          email: "test@example.com",
          name: "Test User",
          emailVerified: true,
        },
      };

      const conditions = generateUserQueryConditions(param);

      expect(conditions).toEqual({
        email: "test@example.com",
        name: "Test User",
        emailVerified: true,
      });
    });

    it("should handle exclude_id option", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewUser> = {
        query: { name: "Test User" },
        options: { exclude_id: "exclude-this-id" },
      };

      const conditions = generateUserQueryConditions(param);

      expect(conditions).toEqual({
        name: "Test User",
        NOT: { id: "exclude-this-id" },
      });
    });

    it("should handle boolean fields correctly", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewUser> = {
        query: {
          emailVerified: false,
          registeredTwoFactor: true,
        },
      };

      const conditions = generateUserQueryConditions(param);

      expect(conditions).toEqual({
        emailVerified: false,
        registeredTwoFactor: true,
      });
    });

    it("should ignore undefined/null fields", () => {
      if (process.env.CI === "true") return;
      const param: HelperParam<NewUser> = {
        query: {
          email: "test@example.com",
          githubId: undefined,
          name: undefined,
        },
      };

      const conditions = generateUserQueryConditions(param);

      expect(conditions).toEqual({
        email: "test@example.com",
      });
    });
  });

  describe("Transactions", () => {
    it("should isolate addUser inside transaction until commit", async () => {
      if (process.env.CI === "true") return;
      const initialCount = (await getUserCountBy({ query: {}, options: {} })).value;
      const { id: _, ...userDataWithoutId } = createUser({
        email: "tx-isolation@example.com",
        name: "Tx Isolation",
      });

      await db().transaction(async (tx) => {
        const addResult = await addUser([userDataWithoutId], tx);
        expect(addResult.valid).toBe(true);

        const inTxCount = (await getUserCountBy({ query: {}, options: { tx } })).value;
        expect(inTxCount).toBe(initialCount + 1);

        const outTxCount = (await getUserCountBy({ query: {}, options: {} })).value;
        expect(outTxCount).toBe(initialCount);
      });

      const finalCount = (await getUserCountBy({ query: {}, options: {} })).value;
      expect(finalCount).toBe(initialCount + 1);
    });

    it("should rollback addUser when transaction throws", async () => {
      if (process.env.CI === "true") return;
      const initialCount = (await getUserCountBy({ query: {}, options: {} })).value;
      const { id: _, ...userDataWithoutId } = createUser({
        email: "tx-rollback@example.com",
        name: "Tx Rollback",
      });

      await expect(
        db().transaction(async (tx) => {
          await addUser([userDataWithoutId], tx);
          throw new Error("force rollback");
        })
      ).rejects.toThrow();

      const finalCount = (await getUserCountBy({ query: {}, options: {} })).value;
      expect(finalCount).toBe(initialCount);
    });

    it("should isolate updateUserBy inside transaction until commit", async () => {
      if (process.env.CI === "true") return;
      const { id: _, ...userDataWithoutId } = createUser({
        email: "tx-update@example.com",
        name: "Before",
      });
      const {
        valid: insertValid,
        value: [addedUser],
      } = await addUser([userDataWithoutId]);
      expect(insertValid).toBe(true);
      const userId = addedUser.id;

      await db().transaction(async (tx) => {
        const updateResult = await updateUserBy(
          { query: { id: userId }, options: { tx } },
          { name: "After" }
        );
        expect(updateResult.valid).toBe(true);

        const inTxUser = (await getUserBy({ query: { id: userId }, options: { tx } })).value[0];
        expect(inTxUser.name).toBe("After");

        const outTxUser = (await getUserBy({ query: { id: userId }, options: {} })).value[0];
        expect(outTxUser.name).toBe("Before");
      });

      const afterCommitUser = (await getUserBy({ query: { id: userId }, options: {} })).value[0];
      expect(afterCommitUser.name).toBe("After");
    });

    it("should rollback updateUserBy when transaction throws", async () => {
      if (process.env.CI === "true") return;
      const { id: _, ...userDataWithoutId } = createUser({
        email: "tx-update-rollback@example.com",
        name: "Original",
      });
      const {
        valid: insertValid,
        value: [addedUser],
      } = await addUser([userDataWithoutId]);
      expect(insertValid).toBe(true);
      const userId = addedUser.id;

      await expect(
        db().transaction(async (tx) => {
          await updateUserBy({ query: { id: userId }, options: { tx } }, { name: "Changed" });
          throw new Error("force rollback");
        })
      ).rejects.toThrow();

      const afterRollbackUser = (await getUserBy({ query: { id: userId }, options: {} })).value[0];
      expect(afterRollbackUser.name).toBe("Original");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle user with very long strings", async () => {
      if (process.env.CI === "true") return;
      const longString = "a".repeat(1000);
      const {
        valid,
        value: [addedUser],
      } = await addUser([
        createUser({
          name: longString,
          email: "long@example.com",
        }),
      ]);

      expect(valid).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedUser.name).toBe(longString);
    });

    it("should handle special characters in user data", async () => {
      if (process.env.CI === "true") return;
      const {
        valid,
        value: [addedUser],
      } = await addUser([
        createUser({
          name: "User with Special Chars: !@#$%^&*()",
          email: "special+chars@example.com",
        }),
      ]);

      expect(valid).toBe(true);
      expect(addedUser).toBeDefined();
      expect(addedUser.name).toBe("User with Special Chars: !@#$%^&*()");
      expect(addedUser.email).toBe("special+chars@example.com");
    });

    it("should handle simultaneous operations correctly", async () => {
      if (process.env.CI === "true") return;
      const promises = Array.from({ length: 10 }, (_, i) => {
        return addUser([
          createUser({
            email: `concurrent${i}@example.com`,
          }),
        ]);
      });

      const results = await Promise.all(promises);

      expect(results.every((result) => result.valid)).toBe(true);
      expect(results.every((result) => result.value.length === 1)).toBe(true);
    });
  });

  describe("deleteUserBy", () => {
    it("should successfully delete user by ID", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([createUser({ email: "delete@example.com" })]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const deleteParam: HelperParam<NewUser> = {
        query: { id: addedUser.id },
      };

      const result = await deleteUserBy(deleteParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(1);
      expect(result.message).toContain("1 user(s) deleted");

      // Verify deletion
      const fetchResult = await getUserBy({
        query: { id: addedUser.id },
      });
      expect(fetchResult.valid).toBe(false);
    });

    it("should successfully delete multiple users by emailVerified", async () => {
      if (process.env.CI === "true") return;

      const usersData = [
        createUser({ emailVerified: true }),
        createUser({ emailVerified: true }),
        createUser({ emailVerified: false }),
      ].map((user) => {
        const { id: _, ...rest } = user;
        return rest;
      });

      const { valid: validUsers, value: addedUsers } = await addUser(usersData);

      expect(validUsers).toBe(true);
      expect(addedUsers).toHaveLength(3);

      const deleteParam: HelperParam<NewUser> = {
        query: { emailVerified: true },
      };

      const result = await deleteUserBy(deleteParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(2);
      expect(result.message).toContain("2 user(s) deleted");

      // Verify deletion
      const countResult = await getUserCountBy({
        query: { emailVerified: true },
      });
      expect(countResult.value).toBe(0);
    });

    it("should handle nonexistent user deletion", async () => {
      if (process.env.CI === "true") return;

      const deleteParam: HelperParam<NewUser> = {
        query: { id: "non-existent-id" },
      };

      const result = await deleteUserBy(deleteParam);

      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
      expect(result.message).toContain("not deleted");
    });

    it("should handle no conditions provided", async () => {
      if (process.env.CI === "true") return;

      const deleteParam: HelperParam<NewUser> = {
        query: {},
      };

      const result = await deleteUserBy(deleteParam);

      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
      expect(result.message).toBe("No conditions provided for deletion");
    });

    it("should delete users with multiple conditions", async () => {
      if (process.env.CI === "true") return;

      const {
        valid: validUser,
        value: [addedUser],
      } = await addUser([
        createUser({
          email: "multi@example.com",
          name: "Multi User",
          emailVerified: true,
        }),
      ]);

      expect(validUser).toBe(true);
      expect(addedUser).toBeDefined();

      const deleteParam: HelperParam<NewUser> = {
        query: { email: "multi@example.com", emailVerified: true },
      };

      const result = await deleteUserBy(deleteParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(1);
      expect(result.message).toContain("1 user(s) deleted");

      // Verify deletion
      const fetchResult = await getUserBy({
        query: { id: addedUser.id },
      });
      expect(fetchResult.valid).toBe(false);
    });
  });
});
