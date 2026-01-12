import { describe, it, expect, beforeEach } from "vitest";
import {
  addUser,
  updateUserBy,
  getUserBy,
  getUsers,
  getUserCountBy,
  mapNewUser_to_DTO,
  generateUserQueryConditions,
} from "../user-crud";
import { createUser, createUsers, resetSequence } from "./helpers/factories";
import type { NewUser } from "$/types/user";
import type { HelperParam } from "$/types/helper";

describe("User CRUD Operations", () => {
  beforeEach(() => {
    resetSequence();
  });

  describe("addUser", () => {
    it("should successfully add a single user", async () => {
      const { id: _, ...userDataWithoutId } = createUser({
        email: "test@example.com",
        name: "Test User",
      });
      const userData = [userDataWithoutId];

      const result = await addUser(userData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 user(s) added");
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toHaveProperty("id");
      expect(result.value[0].email).toBe("test@example.com");
      expect(result.value[0].name).toBe("Test User");
    });

    it("should successfully add multiple users", async () => {
      const usersData = createUsers(3).map((user) => {
        const { id: _, ...userWithoutId } = user;
        return userWithoutId;
      });

      const result = await addUser(usersData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("3 user(s) added");
      expect(result.value).toHaveLength(3);
      expect(result.value.every((user) => user.id)).toBe(true);
    });

    it("should handle empty array input", async () => {
      const result = await addUser([]);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("0 user(s) added");
      expect(result.value).toHaveLength(0);
    });

    it("should handle users with all optional fields", async () => {
      const minimalUser = {
        name: "Minimal User",
        email: "minimal@example.com",
        emailVerified: false,
        registeredTwoFactor: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await addUser([minimalUser]);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].name).toBe("Minimal User");
      expect(result.value[0].email).toBe("minimal@example.com");
      expect(result.value[0].githubId).toBeNull();
      expect(result.value[0].image).toBeNull();
    });
  });

  describe("getUserBy", () => {
    it("should find user by ID", async () => {
      // First add a user
      const { id: _, ...userDataWithoutId } = createUser({
        email: "findme@example.com",
        name: "Find Me",
      });
      const userData = [userDataWithoutId];
      const addResult = await addUser(userData);
      const addedUser = addResult.value[0];

      const searchParam: HelperParam<NewUser> = {
        query: { id: addedUser.id },
        options: {},
      };

      const result = await getUserBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("1 user(s) found");
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe(addedUser.id);
      expect(result.value[0].email).toBe("findme@example.com");
    });

    it("should find user by email", async () => {
      const { id: _, ...userDataWithoutId } = createUser({
        email: "unique@example.com",
        name: "Unique User",
      });
      const userData = [userDataWithoutId];
      await addUser(userData);

      const searchParam: HelperParam<NewUser> = {
        query: { email: "unique@example.com" },
        options: {},
      };

      const result = await getUserBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].email).toBe("unique@example.com");
    });

    it("should find user by githubId", async () => {
      const { id: _, ...userDataWithoutId } = createUser({ githubId: 12345, name: "GitHub User" });
      const userData = [userDataWithoutId];
      await addUser(userData);

      const searchParam: HelperParam<NewUser> = {
        query: { githubId: 12345 },
        options: {},
      };

      const result = await getUserBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(1);
      expect(result.value[0].githubId).toBe(12345);
    });

    it("should return empty result when user not found", async () => {
      const searchParam: HelperParam<NewUser> = {
        query: { id: "nonexistent-id" },
        options: {},
      };

      const result = await getUserBy(searchParam);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("id: nonexistent-id not found");
      expect(result.value).toHaveLength(0);
    });

    it("should apply limit option", async () => {
      const usersData = createUsers(5).map((user) => {
        const { id: _, ...userWithoutId } = user;
        return userWithoutId;
      });
      await addUser(usersData);

      const searchParam: HelperParam<NewUser> = {
        query: {},
        options: { limit: 3 },
      };

      const result = await getUserBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(3);
    });

    it("should apply offset option", async () => {
      const usersData = createUsers(5).map((user) => {
        const { id: _, ...userWithoutId } = user;
        return userWithoutId;
      });
      await addUser(usersData);

      const searchParam: HelperParam<NewUser> = {
        query: {},
        options: { offset: 2, limit: 2 },
      };

      const result = await getUserBy(searchParam);

      expect(result.valid).toBe(true);
      expect(result.value).toHaveLength(2);
    });

    it("should apply fields selection", async () => {
      const { id: _, ...userDataWithoutId } = createUser({
        email: "fields@example.com",
        name: "Fields Test",
      });
      const userData = [userDataWithoutId];
      await addUser(userData);

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
      const usersData = createUsers(3).map((user) => {
        const { id: _, ...userWithoutId } = user;
        return userWithoutId;
      });
      const addResult = await addUser(usersData);
      const excludeId = addResult.value[1].id;

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
      // First add a user
      const { id: _, ...userDataWithoutId } = createUser({
        email: "update@example.com",
        name: "Update Me",
      });
      const userData = [userDataWithoutId];
      const addResult = await addUser(userData);
      const addedUser = addResult.value[0];

      const updateParam: HelperParam<NewUser> = {
        query: { id: addedUser.id },
        options: {},
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
      const { id: _, ...userDataWithoutId } = createUser({ name: "Same Name" });
      const userData = [userDataWithoutId];
      const addResult = await addUser(userData);
      const addedUser = addResult.value[0];

      const updateParam: HelperParam<NewUser> = {
        query: { id: addedUser.id },
        options: {},
      };

      const updateData = { name: "Same Name" };
      const result = await updateUserBy(updateParam, updateData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe("No data changed");
      expect(result.value).toHaveLength(1);
    });

    it("should handle nonexistent user update", async () => {
      const updateParam: HelperParam<NewUser> = {
        query: { id: "nonexistent-id" },
        options: {},
      };

      const updateData = { name: "New Name" };
      const result = await updateUserBy(updateParam, updateData);

      expect(result.valid).toBe(false);
      expect(result.message).toContain("id: nonexistent-id not found");
      expect(result.value).toHaveLength(0);
    });

    it("should update multiple fields at once", async () => {
      const { id: _, ...userDataWithoutId } = createUser({ email: "multi@example.com" });
      const userData = [userDataWithoutId];
      const addResult = await addUser(userData);
      const addedUser = addResult.value[0];

      const updateParam: HelperParam<NewUser> = {
        query: { id: addedUser.id },
        options: {},
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
      const usersData = createUsers(5).map((user) => {
        const { id: _, ...userWithoutId } = user;
        return userWithoutId;
      });
      await addUser(usersData);

      const countParam: HelperParam<NewUser> = {
        query: {},
        options: {},
      };

      const result = await getUserCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(5);
      expect(result.message).toBe("User(s) count is 5");
    });

    it("should return zero count when no users match", async () => {
      const countParam: HelperParam<NewUser> = {
        query: { email: "nonexistent@example.com" },
        options: {},
      };

      const result = await getUserCountBy(countParam);

      expect(result.valid).toBe(false);
      expect(result.value).toBe(0);
      expect(result.message).toContain("email: nonexistent@example.com not found");
    });

    it("should count users with specific criteria", async () => {
      const usersData = [
        createUser({ emailVerified: true }),
        createUser({ emailVerified: true }),
        createUser({ emailVerified: false }),
      ].map((user) => {
        const { id: _, ...userWithoutId } = user;
        return userWithoutId;
      });
      await addUser(usersData);

      const countParam: HelperParam<NewUser> = {
        query: { emailVerified: true },
        options: {},
      };

      const result = await getUserCountBy(countParam);

      expect(result.valid).toBe(true);
      expect(result.value).toBe(2);
    });
  });

  describe("getUsers", () => {
    it("should return DTO format users", async () => {
      const { id: _, ...userDataWithoutId } = createUser({
        email: "dto@example.com",
        name: "DTO User",
      });
      const userData = [userDataWithoutId];
      await addUser(userData);

      const searchParam: HelperParam<NewUser> = {
        query: { email: "dto@example.com" },
        options: {},
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
      const searchParam: HelperParam<NewUser> = {
        query: { email: "nonexistent@example.com" },
        options: {},
      };

      const result = await getUsers(searchParam);

      expect(result).toHaveLength(0);
    });
  });

  describe("mapNewUser_to_DTO", () => {
    it("should correctly map user data to DTO format", async () => {
      const userData = createUser({
        email: "map@example.com",
        name: "Map User",
        githubId: 12345,
        emailVerified: true,
        image: "profile.jpg",
      });

      const result = await mapNewUser_to_DTO([userData]);

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("map@example.com");
      expect(result[0].name).toBe("Map User");
      expect(result[0].githubId).toBe(12345);
      expect(result[0].emailVerified).toBe(true);
      expect(result[0].image).toBe("profile.jpg");
      expect(result[0].registeredTwoFactor).toBe(false);
    });

    it("should handle users with null/undefined values", async () => {
      const userData = createUser({
        githubId: null,
        image: null,
        totpKey: null,
        recoveryCode: null,
      });

      const result = await mapNewUser_to_DTO([userData]);

      expect(result).toHaveLength(1);
      expect(result[0].githubId).toBeNull();
      expect(result[0].image).toBeNull();
    });

    it("should handle empty array input", async () => {
      const result = await mapNewUser_to_DTO([]);

      expect(result).toHaveLength(0);
    });
  });

  describe("generateUserQueryConditions", () => {
    it("should generate correct conditions for single field", () => {
      const param: HelperParam<NewUser> = {
        query: { email: "test@example.com" },
        options: {},
      };

      const conditions = generateUserQueryConditions(param);

      expect(conditions).toEqual({ email: "test@example.com" });
    });

    it("should generate correct conditions for multiple fields", () => {
      const param: HelperParam<NewUser> = {
        query: {
          email: "test@example.com",
          name: "Test User",
          emailVerified: true,
        },
        options: {},
      };

      const conditions = generateUserQueryConditions(param);

      expect(conditions).toEqual({
        email: "test@example.com",
        name: "Test User",
        emailVerified: true,
      });
    });

    it("should handle exclude_id option", () => {
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
      const param: HelperParam<NewUser> = {
        query: {
          emailVerified: false,
          registeredTwoFactor: true,
        },
        options: {},
      };

      const conditions = generateUserQueryConditions(param);

      expect(conditions).toEqual({
        emailVerified: false,
        registeredTwoFactor: true,
      });
    });

    it("should ignore undefined/null fields", () => {
      const param: HelperParam<NewUser> = {
        query: {
          email: "test@example.com",
          githubId: undefined,
          name: undefined,
        },
        options: {},
      };

      const conditions = generateUserQueryConditions(param);

      expect(conditions).toEqual({
        email: "test@example.com",
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle user with very long strings", async () => {
      const longString = "a".repeat(1000);
      const { id: _id, ...userDataWithoutId } = createUser({
        name: longString,
        email: "long@example.com",
      });
      const userData = [userDataWithoutId];

      const result = await addUser(userData);

      expect(result.valid).toBe(true);
      expect(result.value[0].name).toBe(longString);
    });

    it("should handle special characters in user data", async () => {
      const { id: _id2, ...userDataWithoutId } = createUser({
        name: "User with Special Chars: !@#$%^&*()",
        email: "special+chars@example.com",
      });
      const userData = [userDataWithoutId];

      const result = await addUser(userData);

      expect(result.valid).toBe(true);
      expect(result.value[0].name).toBe("User with Special Chars: !@#$%^&*()");
      expect(result.value[0].email).toBe("special+chars@example.com");
    });

    it("should handle simultaneous operations correctly", async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        const { id: _id3, ...userDataWithoutId } = createUser({
          email: `concurrent${i}@example.com`,
        });
        const userData = [userDataWithoutId];
        return addUser(userData);
      });

      const results = await Promise.all(promises);

      expect(results.every((result) => result.valid)).toBe(true);
      expect(results.every((result) => result.value.length === 1)).toBe(true);
    });
  });
});
