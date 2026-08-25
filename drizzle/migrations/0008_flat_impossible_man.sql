CREATE TYPE "public"."support_ticket_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "priority" "support_ticket_priority" DEFAULT 'medium' NOT NULL;--> statement-breakpoint
CREATE INDEX "support_tickets_priority_status_last_message_idx" ON "support_tickets" USING btree ("priority","status","last_message_at");