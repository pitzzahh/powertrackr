/**
 * Types for Plunk API responses and objects
 *
 * These types are intentionally permissive because the Plunk API may include
 * additional fields not explicitly typed here.
 */

export type PlunkFieldError = {
  field: string;
  message: string;
  code?: string;
};

export type PlunkError = {
  /**
   * Machine-readable error code (e.g. VALIDATION_ERROR)
   */
  code: string;
  /**
   * Human readable error message
   */
  message: string;
  /**
   * HTTP status code returned by the API (when available)
   */
  statusCode?: number;
  /**
   * Unique request id for debugging with Plunk support
   */
  requestId?: string;
  /**
   * Field-level validation errors (when applicable)
   */
  errors?: PlunkFieldError[];
  /**
   * Helpful guidance to resolve the error (when provided)
   */
  suggestion?: string;
};

/**
 * Standard success response wrapper for Plunk dashboard/public API endpoints
 */
export type PlunkSuccessResponse<T = unknown> = {
  success: true;
  data: T;
  timestamp?: string;
};

/**
 * Standard error response from Plunk
 */
export type PlunkErrorResponse = {
  success: false;
  error: PlunkError;
  timestamp?: string;
};

/**
 * Union type for responses returned by Plunk endpoints
 */
export type PlunkAPIResponse<T = unknown> = PlunkSuccessResponse<T> | PlunkErrorResponse;

/**
 * Contact model (dashboard endpoints)
 */
export type PlunkContact = {
  id: string;
  email: string;
  subscribed?: boolean;
  data?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: unknown;
};

/**
 * Template model (dashboard endpoints).
 * Templates often include subject and html/content fields. Keep this permissive.
 */
export type PlunkTemplate = {
  id: string;
  name: string;
  subject?: string;
  /**
   * HTML content for the template (if available)
   */
  html?: string;
  /**
   * Alternate content field names that may appear in responses
   */
  content?: string;
  body?: string;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: unknown;
};

/**
 * Data returned for list endpoints (templates, contacts, etc.)
 */
export type PlunkListData<T> = {
  items: T[];
  nextCursor?: string;
  hasMore?: boolean;
  total?: number;
};

/**
 * Data returned by the public transactional API (`/v1/send`)
 * Example: { contact: "cnt_abc123", event: "evt_xyz789", timestamp: "..." }
 */
export type PlunkSendResponseData = {
  contact?: string;
  event?: string;
  timestamp?: string;
  messageId?: string;
  [k: string]: unknown;
};

/**
 * Common payload when sending transactional messages. The Plunk API supports
 * inline content or templates; we keep the shape permissive to support both.
 */
export type PlunkSendRequestPayload = {
  /**
   * Single recipient email or an array of recipients
   */
  to: string | string[];
  /**
   * Inline subject (if not using a template)
   */
  subject?: string;
  /**
   * Inline HTML body (if not using a template)
   */
  body?: string;
  /**
   * Template information (either id or inline template object)
   */
  templateId?: string;
  template?: { id?: string; name?: string; data?: Record<string, unknown> } | string;
  /**
   * Variables used for simple substitution in templates
   */
  variables?: Record<string, string | number | boolean | null>;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{ name: string; type?: string; content?: string }>;
  [k: string]: unknown;
};

/**
 * Track request payload (for /v1/track or dashboard event endpoints)
 */
export type PlunkTrackRequestPayload = {
  email?: string;
  event: string;
  properties?: Record<string, unknown>;
  [k: string]: unknown;
};
