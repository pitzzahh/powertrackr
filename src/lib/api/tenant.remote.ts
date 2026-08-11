import { query, form, command } from "$app/server";
import * as v from "valibot";
import { requireAuth } from "$/server/auth";
import { db } from "$/server/db";
import { and, count, desc, eq, inArray, isNull, max, ne } from "drizzle-orm";
import { tenantReading, readingSubmission, billingInfo, user, payment } from "$/server/db/schema";
import { getUserBy } from "$/server/crud/user-crud";
import { addUser } from "$/server/crud/user-crud";
import { getLastTenantReading, finalizeBillingInfoLogic } from "$/server/crud/billing-info-crud";
import { hashPassword } from "$/server/encryption";
import { calculatePayPerKwh } from "$lib";
import { error, invalid } from "@sveltejs/kit";
import {
  createTenantSchema,
  updateTenantSchema,
  deleteTenantSchema,
  submitReadingSchema,
  updateSubmissionSchema,
} from "$/validators/tenant";
import type { TenantWithMeters, MyMeter, PendingBilling } from "$/types/tenant";
import type { NewUser } from "$/types/user";

// Form to create a tenant account (owner vouches for the credentials)
export const createTenant = form(createTenantSchema, async (data, issues): Promise<NewUser> => {
  const { user: authUser, session } = requireAuth();
  if (authUser.ownerId) error(403, "Only owners can create tenants");

  const { name, email, password } = data;

  const {
    value: [userEmailCheck],
  } = await getUserBy({
    query: { email },
    options: { with_session: false },
  });

  if (userEmailCheck !== undefined && userEmailCheck !== null) {
    invalid(issues.email("Email is already used"));
  }

  const passwordHash = await hashPassword(password);
  const {
    valid,
    value: [tenant],
  } = await addUser([
    {
      email,
      name,
      passwordHash,
      ownerId: session.userId,
      emailVerified: true,
    },
  ]);

  if (!valid) {
    error(400, "Failed to create tenant");
  }
  void getTenants({}).refresh();
  return tenant;
});

// Query to get all tenants of the authenticated owner with their meter info
export const getTenants = query(v.object({}), async (): Promise<TenantWithMeters[]> => {
  const { user: authUser, session } = requireAuth();
  if (authUser.ownerId) error(403, "Only owners can view tenants");

  const tenants = await db().query.user.findMany({
    where: { ownerId: session.userId },
  });

  if (tenants.length === 0) return [];

  const tenantIds = tenants.map((t) => t.id);

  // Most recent billed reading per tenant
  const billedReadings = await db()
    .select({
      tenantUserId: tenantReading.tenantUserId,
      reading: tenantReading.reading,
      date: billingInfo.date,
    })
    .from(tenantReading)
    .innerJoin(billingInfo, eq(billingInfo.id, tenantReading.billingInfoId))
    .where(inArray(tenantReading.tenantUserId, tenantIds));
  const lastBilledByTenant = new Map<string, number>();
  const billedDateByTenant = new Map<string, Date>();
  for (const r of billedReadings) {
    if (r.reading == null) continue; // pending rows are not billed yet
    const current = billedDateByTenant.get(r.tenantUserId);
    if (!current || r.date.getTime() > current.getTime()) {
      lastBilledByTenant.set(r.tenantUserId, r.reading);
      billedDateByTenant.set(r.tenantUserId, r.date);
    }
  }

  // Latest submission per tenant
  const submissions = await db()
    .select({
      tenantUserId: readingSubmission.tenantUserId,
      reading: readingSubmission.reading,
      createdAt: readingSubmission.createdAt,
    })
    .from(readingSubmission)
    .where(inArray(readingSubmission.tenantUserId, tenantIds));
  const latestSubmissionByTenant = new Map<string, { reading: number; createdAt: Date }>();
  for (const s of submissions) {
    const current = latestSubmissionByTenant.get(s.tenantUserId);
    if (!current || s.createdAt.getTime() > current.createdAt.getTime()) {
      latestSubmissionByTenant.set(s.tenantUserId, { reading: s.reading, createdAt: s.createdAt });
    }
  }

  return tenants.map((t) => ({
    id: t.id,
    name: t.name,
    email: t.email,
    lastBilledReading: lastBilledByTenant.get(t.id) ?? null,
    latestSubmission: latestSubmissionByTenant.get(t.id) ?? null,
  }));
});

// Query to get the authenticated tenant's own sub-meter
export const getMyMeter = query(v.object({}), async (): Promise<MyMeter> => {
  const { user: authUser, session } = requireAuth();
  if (!authUser.ownerId) error(403, "Only tenants can view their meter");
  const ownerId = authUser.ownerId;

  const [lastBilled] = await db()
    .select({ reading: tenantReading.reading })
    .from(tenantReading)
    .innerJoin(billingInfo, eq(billingInfo.id, tenantReading.billingInfoId))
    .where(
      and(
        eq(tenantReading.tenantUserId, session.userId),
        ownerId ? eq(billingInfo.userId, ownerId) : undefined
      )
    )
    .orderBy(desc(billingInfo.date))
    .limit(1);

  const [latestSubmission] = await db()
    .select({ reading: readingSubmission.reading, createdAt: readingSubmission.createdAt })
    .from(readingSubmission)
    .where(eq(readingSubmission.tenantUserId, session.userId))
    .orderBy(desc(readingSubmission.createdAt))
    .limit(1);

  return {
    tenantUserId: session.userId,
    name: authUser.name,
    lastBilledReading: lastBilled?.reading ?? null,
    latestSubmission: latestSubmission
      ? { reading: latestSubmission.reading, createdAt: latestSubmission.createdAt }
      : null,
  };
});

// Form for a tenant to submit their current meter reading, optionally for a
// specific pending billing period
export const submitReading = form(
  submitReadingSchema,
  async ({ billingInfoId, reading }, issues) => {
    const { user: authUser, session } = requireAuth();
    if (!authUser.ownerId) error(403, "Only tenants can submit readings");

    const [{ billedMax }] = await db()
      .select({ billedMax: max(tenantReading.reading) })
      .from(tenantReading)
      .where(eq(tenantReading.tenantUserId, session.userId));
    const [{ submittedMax }] = await db()
      .select({ submittedMax: max(readingSubmission.reading) })
      .from(readingSubmission)
      .where(eq(readingSubmission.tenantUserId, session.userId));

    const floor = Math.max(billedMax ?? 0, submittedMax ?? 0);
    if (reading < floor) {
      invalid(issues.reading("Reading must not be lower than the last recorded reading"));
    }

    const [created] = await db()
      .insert(readingSubmission)
      .values({
        id: crypto.randomUUID(),
        tenantUserId: session.userId,
        reading,
      })
      .returning();

    // When submitting for a pending billing, fill the tenant's pending reading
    // row and materialize their usage + payment immediately (the rate is known
    // from the billing). Once every tenant has submitted, finalize the billing
    // so the main payment lands too.
    if (billingInfoId) {
      const ownerId = authUser.ownerId;
      const billing = await db().query.billingInfo.findFirst({
        where: { id: billingInfoId, ...(ownerId ? { userId: ownerId } : {}) },
      });
      if (!billing) {
        error(400, "Unknown billing");
      }

      const prev = await getLastTenantReading(billing.userId, session.userId, billing.date);
      const payPerKwh = calculatePayPerKwh(billing.balance, billing.totalkWh);
      const usage = prev === null ? 0 : reading - prev;
      const amount = Number((usage * payPerKwh).toFixed(2));
      const subPaymentId = crypto.randomUUID();

      await db().batch([
        db().insert(payment).values({
          id: subPaymentId,
          amount,
          date: new Date(),
        }),
        db()
          .update(tenantReading)
          .set({ reading, subkWh: usage, paymentId: subPaymentId, status: "paid" })
          .where(
            and(
              eq(tenantReading.billingInfoId, billingInfoId),
              eq(tenantReading.tenantUserId, session.userId),
              isNull(tenantReading.reading)
            )
          ),
      ]);

      const [{ pendingCount }] = await db()
        .select({ pendingCount: count() })
        .from(tenantReading)
        .where(and(eq(tenantReading.billingInfoId, billingInfoId), isNull(tenantReading.reading)));
      if ((pendingCount ?? 0) === 0) {
        try {
          await finalizeBillingInfoLogic(billingInfoId, billing.userId);
        } catch (err) {
          // The reading is recorded; a finalize failure (e.g. implausible
          // balance) stays visible to the owner to fix and finalize manually.
          console.error("Auto-finalize failed for billing", billingInfoId, err);
        }
      }
    }

    void getMyMeter({}).refresh();
    void getPendingBillings({}).refresh();
    return created;
  }
);

// Query to get billing periods awaiting this tenant's reading submission
export const getPendingBillings = query(v.object({}), async (): Promise<PendingBilling[]> => {
  const { user: authUser, session } = requireAuth();
  if (!authUser.ownerId) error(403, "Only tenants can view pending billings");
  const ownerId = authUser.ownerId;

  const pending = await db()
    .select({
      billingInfoId: tenantReading.billingInfoId,
      date: billingInfo.date,
    })
    .from(tenantReading)
    .innerJoin(billingInfo, eq(billingInfo.id, tenantReading.billingInfoId))
    .where(and(eq(tenantReading.tenantUserId, session.userId), isNull(tenantReading.reading)))
    .orderBy(desc(billingInfo.date));

  return Promise.all(
    pending.map(async (p) => ({
      billingInfoId: p.billingInfoId,
      date: p.date,
      lastBilledReading: ownerId
        ? await getLastTenantReading(ownerId, session.userId, p.date)
        : null,
    }))
  );
});

// Form to rename a tenant (owner vouches for the tenant)
export const updateTenant = form(updateTenantSchema, async ({ tenantUserId, name }) => {
  const { user: authUser, session } = requireAuth();
  if (authUser.ownerId) error(403, "Only owners can update tenants");

  const tenant = await db().query.user.findFirst({ where: { id: tenantUserId } });
  if (!tenant || tenant.ownerId !== session.userId) {
    error(400, "Unknown tenant");
  }

  const [updated] = await db()
    .update(user)
    .set({ name })
    .where(eq(user.id, tenantUserId))
    .returning();

  void getTenants({}).refresh();
  return updated;
});

// Command to delete a tenant (removes their readings and submissions via cascade)
export const deleteTenant = command(deleteTenantSchema, async ({ tenantUserId }) => {
  const { user: authUser, session } = requireAuth();
  if (authUser.ownerId) error(403, "Only owners can delete tenants");

  const tenant = await db().query.user.findFirst({ where: { id: tenantUserId } });
  if (!tenant || tenant.ownerId !== session.userId) {
    error(400, "Unknown tenant");
  }

  await db().delete(user).where(eq(user.id, tenantUserId));

  void getTenants({}).refresh();
  return { ok: true };
});

// Form for a tenant to correct their most recent submission (e.g. forgot or typo)
export const updateSubmission = form(updateSubmissionSchema, async ({ reading }, issues) => {
  const { user: authUser, session } = requireAuth();
  if (!authUser.ownerId) error(403, "Only tenants can update submissions");

  const [latest] = await db()
    .select({ id: readingSubmission.id })
    .from(readingSubmission)
    .where(eq(readingSubmission.tenantUserId, session.userId))
    .orderBy(desc(readingSubmission.createdAt))
    .limit(1);

  if (!latest) {
    error(400, "No submission to update");
  }

  // Floor: the last billed reading or the tenant's other submissions
  const [{ billedMax }] = await db()
    .select({ billedMax: max(tenantReading.reading) })
    .from(tenantReading)
    .where(eq(tenantReading.tenantUserId, session.userId));
  const [{ submittedMax }] = await db()
    .select({ submittedMax: max(readingSubmission.reading) })
    .from(readingSubmission)
    .where(
      and(eq(readingSubmission.tenantUserId, session.userId), ne(readingSubmission.id, latest.id))
    );

  const floor = Math.max(billedMax ?? 0, submittedMax ?? 0);
  if (reading < floor) {
    invalid(issues.reading("Reading must not be lower than the last recorded reading"));
  }

  const [updated] = await db()
    .update(readingSubmission)
    .set({ reading })
    .where(eq(readingSubmission.id, latest.id))
    .returning();

  void getMyMeter({}).refresh();
  return updated;
});
