CREATE TABLE "cash_closures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"business_date" date NOT NULL,
	"expected_cash" numeric(14, 2) NOT NULL,
	"declared_cash" numeric(14, 2) NOT NULL,
	"difference" numeric(14, 2) NOT NULL,
	"snapshot" jsonb NOT NULL,
	"closed_by" uuid NOT NULL,
	"closed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cash_closures" ADD CONSTRAINT "cash_closures_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_closures" ADD CONSTRAINT "cash_closures_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cash_closures_shop_date_unique" ON "cash_closures" USING btree ("shop_id","business_date");--> statement-breakpoint
CREATE INDEX "cash_closures_shop_date_idx" ON "cash_closures" USING btree ("shop_id","business_date");