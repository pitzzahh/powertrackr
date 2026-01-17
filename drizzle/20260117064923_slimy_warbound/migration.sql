CREATE TABLE "billing_info" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"total_kWh" integer NOT NULL,
	"balance" real NOT NULL,
	"status" text NOT NULL,
	"pay_per_kWh" real NOT NULL,
	"payment_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_request" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_session" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"two_factor_verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY,
	"amount" real,
	"date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"two_factor_verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_meter" (
	"id" text PRIMARY KEY,
	"billing_info_id" text NOT NULL,
	"sub_kWh" integer,
	"reading" integer NOT NULL,
	"sub_reading_latest" integer,
	"sub_reading_old" integer,
	"payment_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"github_id" integer UNIQUE,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"totp_key" bytea,
	"recovery_code" bytea,
	"registered_two_factor" boolean DEFAULT false NOT NULL,
	"image" text,
	"password_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "billing_info_user_id_idx" ON "billing_info" ("user_id");--> statement-breakpoint
CREATE INDEX "email_verification_request_user_id_idx" ON "email_verification_request" ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_session_user_id_idx" ON "password_reset_session" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_id_key" ON "payment" ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_id_key" ON "session" ("id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "sub_meter_billing_info_id_idx" ON "sub_meter" ("billing_info_id");--> statement-breakpoint
CREATE INDEX "sub_meter_payment_id_idx" ON "sub_meter" ("payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_key" ON "user" ("email");--> statement-breakpoint
ALTER TABLE "billing_info" ADD CONSTRAINT "billing_info_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "billing_info" ADD CONSTRAINT "billing_info_payment_id_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "billing_info" ADD CONSTRAINT "billing_info_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "billing_info" ADD CONSTRAINT "billing_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "email_verification_request" ADD CONSTRAINT "email_verification_request_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "email_verification_request" ADD CONSTRAINT "email_verification_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "password_reset_session" ADD CONSTRAINT "password_reset_session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "password_reset_session" ADD CONSTRAINT "password_reset_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "sub_meter" ADD CONSTRAINT "sub_meter_billing_info_id_billing_info_id_fkey" FOREIGN KEY ("billing_info_id") REFERENCES "billing_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "sub_meter" ADD CONSTRAINT "sub_meter_payment_id_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "sub_meter" ADD CONSTRAINT "sub_meter_billing_info_id_fkey" FOREIGN KEY ("billing_info_id") REFERENCES "billing_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "sub_meter" ADD CONSTRAINT "sub_meter_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;