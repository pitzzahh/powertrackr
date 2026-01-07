ALTER TABLE `billing_info` RENAME COLUMN `total_kwh` TO `total_kWh`;--> statement-breakpoint
ALTER TABLE `billing_info` RENAME COLUMN `pay_per_kwh` TO `pay_per_kWh`;--> statement-breakpoint
ALTER TABLE `sub_meter` RENAME COLUMN `sub_kwh` TO `sub_kWh`;