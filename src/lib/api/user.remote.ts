import { query, form, getRequestEvent } from "$app/server";
import * as v from "valibot";
import { updateUserSchema, deleteUserSchema } from "#lib/validators/user.js";
import {
  deleteUserBy,
  getUserBy,
  getUserCountLogic,
  updateUserBy,
} from "#lib/server/crud/user-crud.js";
import { error, invalid, redirect } from "@sveltejs/kit";
import {
  invalidateSession,
  deleteSessionTokenCookie,
  requireAuth,
  originCheck,
} from "#lib/server/auth.js";

export const getTotalUserCount = query(() => {
  requireAuth();
  return getUserCountLogic();
});

export const getCurrentUser = query(() => {
  originCheck();
  const { locals } = getRequestEvent();
  return { user: locals.user, session: locals.session };
});

// Query to get a single user by github id (OAuth callback; same-origin only)
export const getUserFromGitHubId = query(v.number(), async (githubId) => {
  originCheck();
  return await getUserBy({
    query: {
      githubId,
    },
    options: {
      limit: 1,
    },
  });
});

// Form to update the authenticated user's own profile
export const updateUser = form(updateUserSchema, async (data) => {
  const { user } = requireAuth();
  const { id: _ignored, ...updateData } = data;
  const {
    valid,
    value: [updatedUser],
    message,
  } = await updateUserBy(
    {
      query: { id: user.id },
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
