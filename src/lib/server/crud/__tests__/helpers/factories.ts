import type { NewUser } from "#lib/types/user.js";
import type { NewPayment } from "#lib/types/payment.js";
import type { NewBillingInfo } from "#lib/types/billing-info.js";
import type { NewTenantReading } from "#lib/types/tenant-reading.js";
import type { NewReadingSubmission } from "#lib/types/reading-submission.js";
import type { NewSession } from "#lib/types/session.js";
import type { NewEmailVerificationRequest } from "#lib/types/email-verification-request.js";
import type { NewPasswordResetSession } from "#lib/types/password-reset-session.js";

export type FactoryOverrides<T> = Partial<T>;

let sequenceCounter = 1;

function getSequence(): number {
  return sequenceCounter++;
}

function generateId(): string {
  return `test-${Date.now()}-${getSequence()}`;
}

export function createUser(overrides: FactoryOverrides<NewUser> = {}): NewUser {
  const sequence = getSequence();
  // Use crypto.randomUUID for id and email, and a random numeric githubId to avoid collisions across tests
  const uuid = crypto.randomUUID();
  const githubIdValue = Math.floor(Math.random() * 1_000_000_000);
  return {
    id: uuid,
    githubId: githubIdValue,
    name: `Test User ${sequence}`,
    email: `user-${uuid}@test.com`,
    emailVerified: false,
    totpKey: null,
    recoveryCode: null,
    registeredTwoFactor: false,
    image: null,
    passwordHash: "hashed-password",
    ownerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * A tenant account: a user owned by `ownerId`. Tenants ARE sub-meters.
 */
export function createTenantUser(
  ownerId: string,
  overrides: FactoryOverrides<NewUser> = {}
): NewUser {
  return createUser({ ownerId, ...overrides });
}

export function createPayment(overrides: FactoryOverrides<NewPayment> = {}): NewPayment {
  const sequence = getSequence();
  return {
    id: generateId(),
    amount: 100.5 + sequence,
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createBillingInfo(
  overrides: FactoryOverrides<NewBillingInfo> = {}
): NewBillingInfo {
  const sequence = getSequence();
  return {
    id: generateId(),
    userId: `user-${sequence}`,
    date: new Date(),
    totalkWh: 1000 + sequence,
    balance: 500.75 + sequence,
    status: "Pending",
    payPerkWh: 0.15,
    paymentId: "",
    ...overrides,
  };
}

export function createTenantReading(
  overrides: FactoryOverrides<NewTenantReading> = {}
): NewTenantReading {
  const sequence = getSequence();
  return {
    id: generateId(),
    tenantUserId: `tenant-${sequence}`,
    billingInfoId: `billing-${sequence}`,
    subkWh: 50 + sequence,
    reading: 1500 + sequence,
    status: "",
    paymentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createReadingSubmission(
  overrides: FactoryOverrides<NewReadingSubmission> = {}
): NewReadingSubmission {
  const sequence = getSequence();
  return {
    id: generateId(),
    tenantUserId: `tenant-${sequence}`,
    reading: 1600 + sequence,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createSession(overrides: FactoryOverrides<NewSession> = {}): NewSession {
  const sequence = getSequence();
  const now = new Date();
  // Use ISO string for expiresAt (seven days from now)
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    id: generateId(),
    userId: `user-${sequence}`,
    expiresAt,
    ipAddress: `192.168.1.${sequence}`,
    userAgent: `Test User Agent ${sequence}`,
    twoFactorVerified: false,
    ...overrides,
  };
}

export function createEmailVerificationRequest(
  overrides: FactoryOverrides<NewEmailVerificationRequest> = {}
): NewEmailVerificationRequest {
  const sequence = getSequence();
  const now = Date.now();
  // expiresAt stored as ISO string (15 minutes from now)
  const expiresAt = new Date(now + 15 * 60 * 1000);
  return {
    id: generateId(),
    userId: `user-${sequence}`,
    email: `user${sequence}@test.com`,
    code: `verification-code-${sequence}`,
    expiresAt,
    ...overrides,
  };
}

export function createPasswordResetSession(
  overrides: FactoryOverrides<NewPasswordResetSession> = {}
): NewPasswordResetSession {
  const sequence = getSequence();
  const now = Date.now();
  // expiresAt stored as ISO string (15 minutes from now)
  const expiresAt = new Date(now + 15 * 60 * 1000);
  return {
    id: generateId(),
    userId: `user-${sequence}`,
    email: `user${sequence}@test.com`,
    code: `reset-code-${sequence}`,
    expiresAt,
    emailVerified: false,
    twoFactorVerified: false,
    ...overrides,
  };
}

export function resetSequence(): void {
  sequenceCounter = 1;
}

// Utility functions for creating multiple items
export function createUsers(count: number, overrides: FactoryOverrides<NewUser> = {}): NewUser[] {
  return Array.from({ length: count }, () => createUser(overrides));
}

export function createTenantUsers(
  count: number,
  ownerId: string,
  overrides: FactoryOverrides<NewUser> = {}
): NewUser[] {
  return Array.from({ length: count }, () => createTenantUser(ownerId, overrides));
}

export function createPayments(
  count: number,
  overrides: FactoryOverrides<NewPayment> = {}
): NewPayment[] {
  return Array.from({ length: count }, () => createPayment(overrides));
}

export function createBillingInfos(
  count: number,
  overrides: FactoryOverrides<NewBillingInfo> = {}
): NewBillingInfo[] {
  return Array.from({ length: count }, () => createBillingInfo(overrides));
}

export function createTenantReadings(
  count: number,
  overrides: FactoryOverrides<NewTenantReading> = {}
): NewTenantReading[] {
  return Array.from({ length: count }, () => createTenantReading(overrides));
}

export function createReadingSubmissions(
  count: number,
  overrides: FactoryOverrides<NewReadingSubmission> = {}
): NewReadingSubmission[] {
  return Array.from({ length: count }, () => createReadingSubmission(overrides));
}

export function createSessions(
  count: number,
  overrides: FactoryOverrides<NewSession> = {}
): NewSession[] {
  return Array.from({ length: count }, () => createSession(overrides));
}

// Helper for creating related data
export interface RelatedDataOptions {
  userCount?: number;
  paymentsPerUser?: number;
  billingInfosPerUser?: number;
  tenantsPerUser?: number;
  readingsPerBilling?: number;
}

export function createRelatedTestData(options: RelatedDataOptions = {}) {
  const {
    userCount = 2,
    paymentsPerUser = 2,
    billingInfosPerUser = 2,
    tenantsPerUser = 2,
    readingsPerBilling = 2,
  } = options;

  const users = createUsers(userCount);
  const payments: NewPayment[] = [];
  const billingInfos: NewBillingInfo[] = [];
  const tenants: NewUser[] = [];
  const tenantReadings: NewTenantReading[] = [];

  users.forEach((user) => {
    // Create payments for user
    const userPayments = createPayments(paymentsPerUser);
    payments.push(...userPayments);

    // Create tenants for user (tenants ARE sub-meters)
    const userTenants = createTenantUsers(tenantsPerUser, user.id);
    tenants.push(...userTenants);

    // Create billing infos for user
    for (let i = 0; i < billingInfosPerUser; i++) {
      const billingInfo = createBillingInfo({
        userId: user.id,
        paymentId: userPayments[i % userPayments.length].id,
      });
      billingInfos.push(billingInfo);

      // Create tenant readings for each billing info
      const billingReadings = createTenantReadings(readingsPerBilling, {
        billingInfoId: billingInfo.id,
        tenantUserId: userTenants[i % userTenants.length].id,
        paymentId: userPayments[i % userPayments.length].id,
      });
      tenantReadings.push(...billingReadings);
    }
  });

  return {
    users,
    payments,
    billingInfos,
    tenants,
    tenantReadings,
  };
}
