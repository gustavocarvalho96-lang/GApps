CREATE TABLE `monthly_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_email` text NOT NULL,
	`month_key` text NOT NULL,
	`entries_json` text DEFAULT '{}' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_schedules_user_month_idx` ON `monthly_schedules` (`user_email`,`month_key`);