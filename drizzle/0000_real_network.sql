-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "Payment" (
	"id" text PRIMARY KEY NOT NULL,
	"amount" double precision,
	"date" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "BillingInfo" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" timestamp(3) NOT NULL,
	"totalKwh" integer NOT NULL,
	"subKwh" integer,
	"balance" double precision NOT NULL,
	"status" text NOT NULL,
	"payPerKwh" double precision NOT NULL,
	"subReadingLatest" integer,
	"subReadingOld" integer,
	"paymentId" text,
	"subPaymentId" text
);
--> statement-breakpoint
CREATE TABLE "Key" (
	"id" text PRIMARY KEY NOT NULL,
	"hashed_password" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"active_expires" bigint NOT NULL,
	"idle_expires" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"picture" text
);
--> statement-breakpoint
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "BillingInfo" ADD CONSTRAINT "BillingInfo_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "BillingInfo" ADD CONSTRAINT "BillingInfo_subPaymentId_fkey" FOREIGN KEY ("subPaymentId") REFERENCES "public"."Payment"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "BillingInfo" ADD CONSTRAINT "BillingInfo_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Key" ADD CONSTRAINT "Key_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "Payment_id_key" ON "Payment" USING btree ("id" text_ops);--> statement-breakpoint
CREATE INDEX "BillingInfo_user_id_idx" ON "BillingInfo" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "Key_user_id_idx" ON "Key" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Session_id_key" ON "Session" USING btree ("id" text_ops);--> statement-breakpoint
CREATE INDEX "Session_user_id_idx" ON "Session" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "User_username_key" ON "User" USING btree ("username" text_ops);--> statement-breakpoint
CREATE POLICY "Enable all access for all users" ON "User" AS PERMISSIVE FOR ALL TO public USING (true);
*/