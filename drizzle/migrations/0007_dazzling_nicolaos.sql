CREATE TYPE "public"."support_author_type" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."support_ticket_category" AS ENUM('account', 'technical', 'data', 'payment', 'feature', 'other');--> statement-breakpoint
CREATE TYPE "public"."support_ticket_status" AS ENUM('open', 'in_progress', 'waiting_user', 'resolved', 'closed');--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"author_type" "support_author_type" NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" varchar(40) NOT NULL,
	"user_id" uuid NOT NULL,
	"shop_id" uuid,
	"category" "support_ticket_category" NOT NULL,
	"subject" varchar(180) NOT NULL,
	"status" "support_ticket_status" DEFAULT 'open' NOT NULL,
	"assigned_admin_id" uuid,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_by" "support_author_type" DEFAULT 'user' NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_admin_id_users_id_fk" FOREIGN KEY ("assigned_admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "support_messages_ticket_created_idx" ON "support_messages" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "support_tickets_user_status_idx" ON "support_tickets" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "support_tickets_status_last_message_idx" ON "support_tickets" USING btree ("status","last_message_at");--> statement-breakpoint
CREATE INDEX "support_tickets_assigned_admin_idx" ON "support_tickets" USING btree ("assigned_admin_id");