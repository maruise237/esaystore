CREATE TABLE "exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"currency" varchar(8) NOT NULL,
	"rate_to_base" numeric(20, 8) NOT NULL,
	"effective_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"note" varchar(240),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_currencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"currency" varchar(8) NOT NULL,
	"label" varchar(80),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "transaction_currency" varchar(8) DEFAULT 'XAF' NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "exchange_rate" numeric(20, 8) DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "transaction_subtotal" numeric(14, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "transaction_discount_amount" numeric(14, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "transaction_total" numeric(14, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "transaction_amount_paid" numeric(14, 2) DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_currencies" ADD CONSTRAINT "shop_currencies_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exchange_rates_shop_currency_date_idx" ON "exchange_rates" USING btree ("shop_id","currency","effective_at");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_currencies_shop_currency_unique" ON "shop_currencies" USING btree ("shop_id","currency");