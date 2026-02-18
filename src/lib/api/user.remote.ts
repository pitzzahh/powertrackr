import { query, form, getRequestEvent } from "$app/server";
import * as v from "valibot";
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  deleteUserSchema,
} from "$/validators/user";
import {
  addUser,
  deleteUserBy,
  getUserBy,
  getUserCountLogic,
  updateUserBy,
} from "$/server/crud/user-crud";
import { error, invalid, redirect } from "@sveltejs/kit";
import { invalidateSession, deleteSessionTokenCookie } from "$/server/auth";

export const getTotalUserCount = query(getUserCountLogic);

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

// Form to delete a user
export const deleteUser = form(deleteUserSchema, async ({ id, confirmEmail }, issues) => {
  const event = getRequestEvent();
  if (event.locals.session === null) {
    error(401, "Not authenticated");
  }

  // Verify user owns the account
  if (id !== event.locals.session.userId) {
    error(403, "Unauthorized to delete this account");
  }

  // Get user's email to verify confirmation
  const {
    valid: userValid,
    value: [user],
  } = await getUserBy({
    query: { id },
    options: { limit: 1 },
  });

  if (!userValid || !user) {
    error(404, "User not found");
  }

  // Verify email matches
  if (user.email !== confirmEmail) {
    invalid(issues.confirmEmail("Email does not match your account email"));
  }

  // Delete the user
  const { valid, message } = await deleteUserBy({ query: { id } });
  if (!valid) {
    error(400, message || "Failed to delete user");
  }

  // Invalidate session and redirect
  invalidateSession(event.locals.session.id);
  deleteSessionTokenCookie(event);

  return redirect(303, "/");
});
