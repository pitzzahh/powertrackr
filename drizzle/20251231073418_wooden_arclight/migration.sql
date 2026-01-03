CREATE TABLE `billing_info` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`total_kwh` integer NOT NULL,
	`sub_kwh` integer,
	`balance` real NOT NULL,
	`status` text NOT NULL,
	`pay_per_kwh` real NOT NULL,
	`sub_reading_latest` integer,
	`sub_reading_old` integer,
	`payment_id` text,
	`sub_payment_id` text,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	`updated_at` integer DEFAULT (current_timestamp) NOT NULL,
	CONSTRAINT `billing_info_payment_id_fkey` FOREIGN KEY (`payment_id`) REFERENCES `Payment`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `billing_info_sub_payment_id_fkey` FOREIGN KEY (`sub_payment_id`) REFERENCES `Payment`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `billing_info_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `Payment` (
	`id` text PRIMARY KEY,
	`amount` real,
	`date` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	`updated_at` integer DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL UNIQUE,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	`updated_at` integer DEFAULT (current_timestamp) NOT NULL,
	CONSTRAINT `fk_session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `session_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL,
	`updated_at` integer DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `billing_info_user_id_idx` ON `billing_info` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `Payment_id_key` ON `Payment` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_id_key` ON `session` (`id`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_key` ON `user` (`email`);