import { query, form, command } from "$app/server";
import * as v from "valibot";
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  deleteUserSchema,
} from "$/validators/user";
import { addUser, deleteUserBy, getUserBy, updateUserBy } from "$/server/crud/user-crud";
import { error } from "@sveltejs/kit";

// Query to get all users
export const getUsers = query(v.object({}), async () => {
  return await getUserBy({ query: {} });
});

// Query to get a single user by id
export const getUser = query(getUserSchema, async (id) => {
  return await getUserBy({
    query: {
      id,
    },
    options: { limit: 1 },
  });
});

// Query to get a single user by github id
export const getUserFromGitHubId = query(v.number(), async (githubId) => {
  return await getUserBy({
    query: {
      githubId,
    },
    options: {
      limit: 1,
    },
  });
});

// Form to create a new user
export const createUser = form(createUserSchema, async (user) => {
  const {
    valid,
    value: [addedUser],
  } = await addUser([user]);

  if (valid) return error(400, "Failed to create user");

  return addedUser;
});

// Form to update an existing user
export const updateUser = form(updateUserSchema, async (data) => {
  const { id, ...updateData } = data;
  const {
    valid,
    value: [updatedUser],
    message,
  } = await updateUserBy(
    {
      query: { id },
    },
    updateData
  );

  if (!valid) {
    error(400, message || "Failed to update user");
  }
  return updatedUser;
});

// Command to delete a user
export const deleteUser = command(deleteUserSchema, async ({ id }) => {
  const { valid, message } = await deleteUserBy({ query: { id } });
  if (!valid) {
    error(400, message || "Failed to delete user");
  }

  return valid;
});
