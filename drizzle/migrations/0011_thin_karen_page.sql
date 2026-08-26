CREATE TYPE "public"."purchase_status" AS ENUM('received', 'pending');--> statement-breakpoint
CREATE TABLE "purchase_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_id" uuid NOT NULL,
	"product_id" uuid,
	"product_name" varchar(240) NOT NULL,
	"quantity" numeric(14, 3) NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"line_total" numeric(14, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"supplier_id" uuid,
	"created_by" uuid NOT NULL,
	"purchase_number" varchar(80) NOT NULL,
	"operation_id" varchar(96),
	"status" "purchase_status" DEFAULT 'received' NOT NULL,
	"payment_method" varchar(48),
	"subtotal" numeric(14, 2) DEFAULT 0 NOT NULL,
	"tax_amount" numeric(14, 2) DEFAULT 0 NOT NULL,
	"total" numeric(14, 2) DEFAULT 0 NOT NULL,
	"purchased_at" timestamp with time zone DEFAULT now() NOT NULL,
	"received_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"reference" varchar(80),
	"contact_name" varchar(180),
	"phone" varchar(48),
	"email" varchar(320),
	"city" varchar(120),
	"delivery_lead_days" integer,
	"payment_terms" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "purchases_shop_number_unique" ON "purchases" USING btree ("shop_id","purchase_number");--> statement-breakpoint
CREATE UNIQUE INDEX "purchases_shop_operation_unique" ON "purchases" USING btree ("shop_id","operation_id");--> statement-breakpoint
CREATE INDEX "purchases_shop_purchased_at_idx" ON "purchases" USING btree ("shop_id","purchased_at");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_shop_name_unique" ON "suppliers" USING btree ("shop_id","name");--> statement-breakpoint
CREATE INDEX "suppliers_shop_reference_idx" ON "suppliers" USING btree ("shop_id","reference");