import type { readingSubmission } from "$/server/db/schema";

export type ReadingSubmission = typeof readingSubmission.$inferSelect;
export type NewReadingSubmission = typeof readingSubmission.$inferInsert;
