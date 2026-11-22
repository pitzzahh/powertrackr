import { query, form, getRequestEvent } from "$app/server";
import { UPDATE_USER_SCHEMA, DELETE_USER_SCHEMA } from "#lib/validators/user.js";
import { deleteUserBy, getUserBy, updateUserBy } from "#lib/server/crud/user-crud.js";
import { getTenantReadingBy } from "#lib/server/crud/tenant-reading-crud.js";
import { error, invalid, redirect } from "@sveltejs/kit";
import {
  invalidateSession,
  deleteSessionTokenCookie,
  requireAuth,
  originCheck,
} from "#lib/server/auth.js";

export const getCurrentUser = query(() => {
  originCheck();
  const { locals } = getRequestEvent();
  return { user: locals.user, session: locals.session };
});

// Form to update the authenticated user's own profile
export const updateUser = form(UPDATE_USER_SCHEMA, async (data, issues) => {
  const { user } = requireAuth();
  const emailChanged = data.email !== undefined && data.email !== user.email;

  if (emailChanged) {
    const {
      value: [taken],
    } = await getUserBy({ query: { email: data.email }, options: { limit: 1, fields: ["id"] } });
    if (taken) invalid(issues.email("Email is already used"));
  }

  const {
    valid,
    value: [updatedUser],
    message,
  } = await updateUserBy(
    { query: { id: user.id } },
    // A new address must be verified again before it counts as verified.
    emailChanged ? { ...data, emailVerified: false } : data
  );

  if (!valid) {
    error(400, message || "Failed to update user");
  }
  return updatedUser;
});

// Form to delete a user
export const deleteUser = form(DELETE_USER_SCHEMA, async ({ id, confirmEmail }, issues) => {
  const event = getRequestEvent();
  const { user, session } = requireAuth();

  // Verify user owns the account
  if (id !== user.id) {
    error(403, "Unauthorized to delete this account");
  }

  if (user.email !== confirmEmail) {
    invalid(issues.confirmEmail("Email does not match your account email"));
  }

  // A tenant's readings are part of the owner's bills; deleting them would
  // leave those bills not adding up, so only the owner may remove the tenant.
  if (user.ownerId) {
    const {
      value: [reading],
    } = await getTenantReadingBy({
      query: { tenantUserId: id },
      options: { limit: 1, fields: ["id"] },
    });
    if (reading) {
      invalid(
        issues.confirmEmail(
          "Your readings are part of your owner's bills. Ask your owner to remove your account."
        )
      );
    }
  }

  const { valid, message } = await deleteUserBy({ query: { id } });
  if (!valid) {
    error(400, message || "Failed to delete user");
  }

  // The user row cascade-deletes its sessions; this also covers the cookie.
  await invalidateSession(session.id);
  deleteSessionTokenCookie(event);

  redirect(303, "/");
});
