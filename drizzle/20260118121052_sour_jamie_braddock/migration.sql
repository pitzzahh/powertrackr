ALTER TABLE "billing_info" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "payment" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "sub_meter" ALTER COLUMN "sub_kWh" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sub_meter" ALTER COLUMN "payment_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sub_meter" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updated_at" DROP DEFAULT;