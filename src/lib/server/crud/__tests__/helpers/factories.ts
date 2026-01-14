import type { NewUser } from "$/types/user";
import type { NewPayment } from "$/types/payment";
import type { NewBillingInfo } from "$/types/billing-info";
import type { NewSubMeter } from "$/types/sub-meter";
import type { NewSession } from "$/types/session";
import type { NewEmailVerificationRequest } from "$/types/email-verification-request";
import type { NewPasswordResetSession } from "$/types/password-reset-session";

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
  return {
    id: generateId(),
    githubId: sequence,
    name: `Test User ${sequence}`,
    email: `user${sequence}@test.com`,
    emailVerified: false,
    totpKey: null,
    recoveryCode: null,
    registeredTwoFactor: false,
    image: null,
    passwordHash: "hashed-password",
    // Use ISO strings for timestamps in tests/factories
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createPayment(overrides: FactoryOverrides<NewPayment> = {}): NewPayment {
  const sequence = getSequence();
  return {
    id: generateId(),
    amount: 100.5 + sequence,
    date: new Date().toISOString(),
    // Use ISO strings for timestamps in tests/factories
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    date: new Date().toISOString(),
    totalkWh: 1000 + sequence,
    balance: 500.75 + sequence,
    status: "Pending",
    payPerkWh: 0.15,
    paymentId: null,
    // Use ISO strings for timestamps in tests/factories
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createSubMeter(overrides: FactoryOverrides<NewSubMeter> = {}): NewSubMeter {
  const sequence = getSequence();
  return {
    id: generateId(),
    billingInfoId: `billing-${sequence}`,
    subkWh: 50 + sequence,
    subReadingLatest: 1500 + sequence,
    subReadingOld: 1450 + sequence,
    paymentId: null,
    // Use ISO strings for timestamps in tests/factories
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createSession(overrides: FactoryOverrides<NewSession> = {}): NewSession {
  const sequence = getSequence();
  const now = new Date();
  // Use ISO string for expiresAt (seven days from now)
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
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
  const expiresAt = new Date(now + 15 * 60 * 1000).toISOString();
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
  const expiresAt = new Date(now + 15 * 60 * 1000).toISOString();
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

export function createSubMeters(
  count: number,
  overrides: FactoryOverrides<NewSubMeter> = {}
): NewSubMeter[] {
  return Array.from({ length: count }, () => createSubMeter(overrides));
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
  subMetersPerBilling?: number;
}

export function createRelatedTestData(options: RelatedDataOptions = {}) {
  const {
    userCount = 2,
    paymentsPerUser = 2,
    billingInfosPerUser = 2,
    subMetersPerBilling = 2,
  } = options;

  const users = createUsers(userCount);
  const payments: NewPayment[] = [];
  const billingInfos: NewBillingInfo[] = [];
  const subMeters: NewSubMeter[] = [];

  users.forEach((user) => {
    // Create payments for user
    const userPayments = createPayments(paymentsPerUser);
    payments.push(...userPayments);

    // Create billing infos for user
    for (let i = 0; i < billingInfosPerUser; i++) {
      const billingInfo = createBillingInfo({
        userId: user.id,
        paymentId: userPayments[i % userPayments.length]?.id || null,
      });
      billingInfos.push(billingInfo);

      // Create sub meters for each billing info
      const billingSubMeters = createSubMeters(subMetersPerBilling, {
        billingInfoId: billingInfo.id,
        paymentId: userPayments[i % userPayments.length]?.id || null,
      });
      subMeters.push(...billingSubMeters);
    }
  });

  return {
    users,
    payments,
    billingInfos,
    subMeters,
  };
}
