CREATE TABLE "auth_rate_limits" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"blocked_until" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "auth_rate_limits_blocked_idx" ON "auth_rate_limits" USING btree ("blocked_until");