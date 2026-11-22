-- Billings with no sub meters were saved as "pending" with no main payment
-- (an empty sub-meter list counted as "all pending"). Give each one its main
-- payment: the full balance, dated on the billing. The payment reuses the
-- billing id, which is unique and makes the link below a plain join.
INSERT INTO `payment` (`id`, `amount`, `date`, `created_at`, `updated_at`)
SELECT b.`id`, b.`balance`, b.`date`, unixepoch() * 1000, unixepoch() * 1000
FROM `billing_info` b
WHERE b.`payment_id` IS NULL
  AND NOT EXISTS (SELECT 1 FROM `tenant_reading` t WHERE t.`billing_info_id` = b.`id`);
--> statement-breakpoint
UPDATE `billing_info` SET `payment_id` = `id`
WHERE `payment_id` IS NULL
  AND NOT EXISTS (SELECT 1 FROM `tenant_reading` t WHERE t.`billing_info_id` = `billing_info`.`id`);
