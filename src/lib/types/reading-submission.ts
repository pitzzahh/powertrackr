import type { readingSubmission } from "#lib/server/db/schema/index.js";

export type ReadingSubmission = typeof readingSubmission.$inferSelect;
export type NewReadingSubmission = typeof readingSubmission.$inferInsert;
