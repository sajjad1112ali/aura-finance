CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`color` text NOT NULL,
	`type` text NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL,
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `categories_user_id_idx` ON `categories` (`user_id`);--> statement-breakpoint
CREATE TABLE `extra_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`notes` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `extra_transactions_user_id_idx` ON `extra_transactions` (`user_id`);--> statement-breakpoint
CREATE TABLE `recurring_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`category_id` text NOT NULL,
	`description` text NOT NULL,
	`frequency` text NOT NULL,
	`start_date` text NOT NULL,
	`last_posted_date` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `recurring_rules_user_id_idx` ON `recurring_rules` (`user_id`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`category_id` text NOT NULL,
	`date` text NOT NULL,
	`description` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`recurring_rule_id` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recurring_rule_id`) REFERENCES `recurring_rules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `transactions_user_id_idx` ON `transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `transactions_date_idx` ON `transactions` (`date`);--> statement-breakpoint
CREATE INDEX `transactions_category_id_idx` ON `transactions` (`category_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);