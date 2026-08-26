var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/vercel/trpcHandler.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/routers.ts
import { eq as eq11 } from "drizzle-orm";
import { z as z10 } from "zod";

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminAuditLogs: () => adminAuditLogs,
  authRateLimits: () => authRateLimits,
  cashClosures: () => cashClosures,
  customers: () => customers,
  dataImports: () => dataImports,
  exchangeRates: () => exchangeRates,
  expenses: () => expenses,
  movementTypeEnum: () => movementTypeEnum,
  neonAuthIdentities: () => neonAuthIdentities,
  paymentMethodEnum: () => paymentMethodEnum,
  productVariants: () => productVariants,
  products: () => products,
  purchaseItems: () => purchaseItems,
  purchaseStatusEnum: () => purchaseStatusEnum,
  purchases: () => purchases,
  receivables: () => receivables,
  repayments: () => repayments,
  saleItems: () => saleItems,
  saleStatusEnum: () => saleStatusEnum,
  sales: () => sales,
  shopCurrencies: () => shopCurrencies,
  shopMembers: () => shopMembers,
  shopRoleEnum: () => shopRoleEnum,
  shops: () => shops,
  stockMovements: () => stockMovements,
  suppliers: () => suppliers,
  supportAuthorTypeEnum: () => supportAuthorTypeEnum,
  supportMessages: () => supportMessages,
  supportTicketCategoryEnum: () => supportTicketCategoryEnum,
  supportTicketPriorityEnum: () => supportTicketPriorityEnum,
  supportTicketStatusEnum: () => supportTicketStatusEnum,
  supportTickets: () => supportTickets,
  syncKindEnum: () => syncKindEnum,
  syncOperations: () => syncOperations,
  userRoleEnum: () => userRoleEnum,
  users: () => users
});
import {
  boolean,
  date,
  integer,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";
var money = (name) => numeric(name, { precision: 14, scale: 2, mode: "number" });
var quantity = (name) => numeric(name, { precision: 14, scale: 3, mode: "number" });
var userRoleEnum = pgEnum("user_role", ["user", "admin"]);
var shopRoleEnum = pgEnum("shop_role", ["owner", "manager", "seller"]);
var movementTypeEnum = pgEnum("stock_movement_type", [
  "opening",
  "restock",
  "adjustment",
  "sale",
  "return"
]);
var paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "mobile_money",
  "credit",
  "mixed"
]);
var purchaseStatusEnum = pgEnum("purchase_status", [
  "received",
  "pending"
]);
var saleStatusEnum = pgEnum("sale_status", ["completed", "cancelled"]);
var syncKindEnum = pgEnum("sync_kind", [
  "sale",
  "expense",
  "repayment",
  "adjustment"
]);
var supportTicketStatusEnum = pgEnum("support_ticket_status", [
  "open",
  "in_progress",
  "waiting_user",
  "resolved",
  "closed"
]);
var supportTicketCategoryEnum = pgEnum("support_ticket_category", [
  "account",
  "technical",
  "data",
  "payment",
  "feature",
  "other"
]);
var supportAuthorTypeEnum = pgEnum("support_author_type", [
  "user",
  "admin"
]);
var supportTicketPriorityEnum = pgEnum("support_ticket_priority", [
  "low",
  "medium",
  "high"
]);
var users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  openId: varchar("open_id", { length: 128 }).unique(),
  email: varchar("email", { length: 320 }).unique(),
  name: varchar("name", { length: 160 }),
  passwordHash: text("password_hash"),
  loginMethod: varchar("login_method", { length: 64 }).default("password").notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull()
});
var neonAuthIdentities = pgTable(
  "neon_auth_identities",
  {
    externalUserId: uuid("external_user_id").primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [index("neon_auth_identities_user_idx").on(table.userId)]
);
var authRateLimits = pgTable(
  "auth_rate_limits",
  {
    key: varchar("key", { length: 64 }).primaryKey(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true }).defaultNow().notNull(),
    blockedUntil: timestamp("blocked_until", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [index("auth_rate_limits_blocked_idx").on(table.blockedUntil)]
);
var shops = pgTable("shops", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  currency: varchar("currency", { length: 8 }).default("XAF").notNull(),
  country: varchar("country", { length: 3 }).default("CMR").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  suspensionReason: varchar("suspension_reason", { length: 240 }),
  suspendedBy: uuid("suspended_by").references(() => users.id, {
    onDelete: "restrict"
  }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
    action: varchar("action", { length: 80 }).notNull(),
    targetType: varchar("target_type", { length: 40 }).notNull(),
    targetId: varchar("target_id", { length: 128 }),
    metadata: jsonb("metadata").$type().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("admin_audit_logs_created_idx").on(table.createdAt),
    index("admin_audit_logs_actor_created_idx").on(
      table.actorId,
      table.createdAt
    ),
    index("admin_audit_logs_target_idx").on(table.targetType, table.targetId)
  ]
);
var supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketNumber: varchar("ticket_number", { length: 40 }).notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
    shopId: uuid("shop_id").references(() => shops.id, {
      onDelete: "set null"
    }),
    category: supportTicketCategoryEnum("category").notNull(),
    subject: varchar("subject", { length: 180 }).notNull(),
    priority: supportTicketPriorityEnum("priority").default("medium").notNull(),
    status: supportTicketStatusEnum("status").default("open").notNull(),
    assignedAdminId: uuid("assigned_admin_id").references(() => users.id, {
      onDelete: "set null"
    }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).defaultNow().notNull(),
    lastMessageBy: supportAuthorTypeEnum("last_message_by").default("user").notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("support_tickets_user_status_idx").on(table.userId, table.status),
    index("support_tickets_status_last_message_idx").on(
      table.status,
      table.lastMessageAt
    ),
    index("support_tickets_priority_status_last_message_idx").on(
      table.priority,
      table.status,
      table.lastMessageAt
    ),
    index("support_tickets_assigned_admin_idx").on(table.assignedAdminId)
  ]
);
var supportMessages = pgTable(
  "support_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketId: uuid("ticket_id").references(() => supportTickets.id, { onDelete: "cascade" }).notNull(),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
    authorType: supportAuthorTypeEnum("author_type").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("support_messages_ticket_created_idx").on(
      table.ticketId,
      table.createdAt
    )
  ]
);
var shopMembers = pgTable(
  "shop_members",
  {
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    role: shopRoleEnum("role").default("seller").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    primaryKey({ columns: [table.shopId, table.userId] }),
    index("shop_members_user_idx").on(table.userId)
  ]
);
var shopCurrencies = pgTable(
  "shop_currencies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }).notNull(),
    currency: varchar("currency", { length: 8 }).notNull(),
    label: varchar("label", { length: 80 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("shop_currencies_shop_currency_unique").on(
      table.shopId,
      table.currency
    )
  ]
);
var exchangeRates = pgTable(
  "exchange_rates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }).notNull(),
    currency: varchar("currency", { length: 8 }).notNull(),
    rateToBase: numeric("rate_to_base", {
      precision: 20,
      scale: 8,
      mode: "number"
    }).notNull(),
    effectiveAt: timestamp("effective_at", { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
    note: varchar("note", { length: 240 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("exchange_rates_shop_currency_date_idx").on(
      table.shopId,
      table.currency,
      table.effectiveAt
    )
  ]
);
var products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }).notNull(),
    name: varchar("name", { length: 240 }).notNull(),
    reference: varchar("reference", { length: 120 }),
    barcode: varchar("barcode", { length: 120 }),
    category: varchar("category", { length: 120 }).default("Sans cat\xE9gorie").notNull(),
    unit: varchar("unit", { length: 24 }).default("unit\xE9").notNull(),
    purchasePrice: money("purchase_price").default(0).notNull(),
    salePrice: money("sale_price").default(0).notNull(),
    wholesalePrice: money("wholesale_price"),
    stockQuantity: quantity("stock_quantity").default(0).notNull(),
    alertThreshold: quantity("alert_threshold").default(5).notNull(),
    expiryDate: timestamp("expiry_date", { withTimezone: true }),
    photoUrl: text("photo_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("products_shop_name_idx").on(table.shopId, table.name),
    uniqueIndex("products_shop_barcode_unique").on(table.shopId, table.barcode)
  ]
);
var productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }).notNull(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    attributes: jsonb("attributes").$type().default({}).notNull(),
    reference: varchar("reference", { length: 120 }),
    barcode: varchar("barcode", { length: 120 }),
    purchasePrice: money("purchase_price").default(0).notNull(),
    salePrice: money("sale_price").default(0).notNull(),
    stockQuantity: quantity("stock_quantity").default(0).notNull(),
    alertThreshold: quantity("alert_threshold").default(5).notNull(),
    photoUrl: text("photo_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("product_variants_shop_product_idx").on(
      table.shopId,
      table.productId
    ),
    uniqueIndex("product_variants_shop_barcode_unique").on(
      table.shopId,
      table.barcode
    )
  ]
);
var customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    phone: varchar("phone", { length: 48 }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [index("customers_shop_name_idx").on(table.shopId, table.name)]
);
var suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    reference: varchar("reference", { length: 80 }),
    contactName: varchar("contact_name", { length: 180 }),
    phone: varchar("phone", { length: 48 }),
    email: varchar("email", { length: 320 }),
    city: varchar("city", { length: 120 }),
    deliveryLeadDays: integer("delivery_lead_days"),
    paymentTerms: varchar("payment_terms", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("suppliers_shop_name_unique").on(table.shopId, table.name),
    index("suppliers_shop_reference_idx").on(table.shopId, table.reference)
  ]
);
var purchases = pgTable(
  "purchases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }).notNull(),
    supplierId: uuid("supplier_id").references(() => suppliers.id, {
      onDelete: "set null"
    }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
    purchaseNumber: varchar("purchase_number", { length: 80 }).notNull(),
    operationId: varchar("operation_id", { length: 96 }),
    status: purchaseStatusEnum("status").default("received").notNull(),
    paymentMethod: varchar("payment_method", { length: 48 }),
    subtotal: money("subtotal").default(0).notNull(),
    taxAmount: money("tax_amount").default(0).notNull(),
    total: money("total").default(0).notNull(),
    purchasedAt: timestamp("purchased_at", { withTimezone: true }).defaultNow().notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("purchases_shop_number_unique").on(
      table.shopId,
      table.purchaseNumber
    ),
    uniqueIndex("purchases_shop_operation_unique").on(
      table.shopId,
      table.operationId
    ),
    index("purchases_shop_purchased_at_idx").on(table.shopId, table.purchasedAt)
  ]
);
var purchaseItems = pgTable("purchase_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  purchaseId: uuid("purchase_id").references(() => purchases.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "restrict"
  }),
  productName: varchar("product_name", { length: 240 }).notNull(),
  quantity: quantity("quantity").notNull(),
  unitPrice: money("unit_price").notNull(),
  lineTotal: money("line_total").notNull()
});
var sales = pgTable(
  "sales",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }).notNull(),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null"
    }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
    saleNumber: varchar("sale_number", { length: 40 }).notNull(),
    operationId: varchar("operation_id", { length: 96 }),
    subtotal: money("subtotal").default(0).notNull(),
    discountAmount: money("discount_amount").default(0).notNull(),
    total: money("total").default(0).notNull(),
    amountPaid: money("amount_paid").default(0).notNull(),
    creditAmount: money("credit_amount").default(0).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentBreakdown: jsonb("payment_breakdown").$type().default({}).notNull(),
    transactionCurrency: varchar("transaction_currency", { length: 8 }).default("XAF").notNull(),
    exchangeRate: numeric("exchange_rate", {
      precision: 20,
      scale: 8,
      mode: "number"
    }).default(1).notNull(),
    transactionSubtotal: money("transaction_subtotal").default(0).notNull(),
    transactionDiscountAmount: money("transaction_discount_amount").default(0).notNull(),
    transactionTotal: money("transaction_total").default(0).notNull(),
    transactionAmountPaid: money("transaction_amount_paid").default(0).notNull(),
    transactionPaymentBreakdown: jsonb("transaction_payment_breakdown").$type().default({}).notNull(),
    status: saleStatusEnum("status").default("completed").notNull(),
    soldAt: timestamp("sold_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("sales_shop_number_unique").on(table.shopId, table.saleNumber),
    uniqueIndex("sales_shop_operation_unique").on(
      table.shopId,
      table.operationId
    ),
    index("sales_shop_sold_at_idx").on(table.shopId, table.soldAt)
  ]
);
var saleItems = pgTable("sale_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  saleId: uuid("sale_id").references(() => sales.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "restrict" }).notNull(),
  productVariantId: uuid("product_variant_id").references(
    () => productVariants.id,
    { onDelete: "restrict" }
  ),
  productName: varchar("product_name", { length: 240 }).notNull(),
  quantity: quantity("quantity").notNull(),
  unitPrice: money("unit_price").notNull(),
  purchasePrice: money("purchase_price").notNull(),
  lineTotal: money("line_total").notNull()
});
var stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }).notNull(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "restrict" }).notNull(),
    productVariantId: uuid("product_variant_id").references(
      () => productVariants.id,
      { onDelete: "restrict" }
    ),
    saleId: uuid("sale_id").references(() => sales.id, {
      onDelete: "set null"
    }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
    type: movementTypeEnum("type").notNull(),
    quantityDelta: quantity("quantity_delta").notNull(),
    stockAfter: quantity("stock_after").notNull(),
    reason: varchar("reason", { length: 240 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("stock_movements_shop_created_idx").on(table.shopId, table.createdAt)
  ]
);
var receivables = pgTable(
  "receivables",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }).notNull(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "restrict" }).notNull(),
    saleId: uuid("sale_id").references(() => sales.id, { onDelete: "restrict" }).notNull().unique(),
    originalAmount: money("original_amount").notNull(),
    balance: money("balance").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    isSettled: boolean("is_settled").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index("receivables_shop_customer_idx").on(table.shopId, table.customerId)
  ]
);
var repayments = pgTable(
  "repayments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }).notNull(),
    receivableId: uuid("receivable_id").references(() => receivables.id, { onDelete: "restrict" }).notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
    operationId: varchar("operation_id", { length: 96 }),
    amount: money("amount").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").default("cash").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("repayments_shop_operation_unique").on(
      table.shopId,
      table.operationId
    )
  ]
);
var expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }).notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
    operationId: varchar("operation_id", { length: 96 }),
    category: varchar("category", { length: 120 }).notNull(),
    amount: money("amount").notNull(),
    note: text("note"),
    spentAt: timestamp("spent_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("expenses_shop_operation_unique").on(
      table.shopId,
      table.operationId
    )
  ]
);
var cashClosures = pgTable(
  "cash_closures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }).notNull(),
    businessDate: date("business_date").notNull(),
    expectedCash: money("expected_cash").notNull(),
    declaredCash: money("declared_cash").notNull(),
    difference: money("difference").notNull(),
    snapshot: jsonb("snapshot").$type().notNull(),
    closedBy: uuid("closed_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("cash_closures_shop_date_unique").on(
      table.shopId,
      table.businessDate
    ),
    index("cash_closures_shop_date_idx").on(table.shopId, table.businessDate)
  ]
);
var dataImports = pgTable(
  "data_imports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }).notNull(),
    fingerprint: varchar("fingerprint", { length: 128 }).notNull(),
    fileName: varchar("file_name", { length: 240 }).notNull(),
    summary: jsonb("summary").$type().notNull(),
    importedBy: uuid("imported_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("data_imports_shop_fingerprint_unique").on(
      table.shopId,
      table.fingerprint
    ),
    index("data_imports_shop_created_idx").on(table.shopId, table.createdAt)
  ]
);
var syncOperations = pgTable(
  "sync_operations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id").references(() => shops.id, { onDelete: "cascade" }).notNull(),
    operationId: varchar("operation_id", { length: 96 }).notNull(),
    kind: syncKindEnum("kind").notNull(),
    payload: jsonb("payload").$type().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex("sync_operations_shop_operation_unique").on(
      table.shopId,
      table.operationId
    )
  ]
);

// server/db.ts
import { neon } from "@neondatabase/serverless";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
var cachedDb = null;
var cachedSql = null;
function connectionString() {
  const value = process.env.NEON_DATABASE_URL;
  if (!value) throw new Error("NEON_DATABASE_URL is not configured");
  return value;
}
function createDb() {
  return drizzle({ client: neon(connectionString()), schema: schema_exports });
}
function getDb() {
  if (!cachedDb) cachedDb = createDb();
  return cachedDb;
}
function getSql() {
  if (!cachedSql) cachedSql = neon(connectionString());
  return cachedSql;
}
async function rawRows(query, params = []) {
  const response = await getSql().query(query, params);
  if (Array.isArray(response)) return response;
  return response.rows ?? [];
}
async function getUserById(id) {
  const rows = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0];
}
async function getUserByEmail(email) {
  const [user] = await getDb().select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return user;
}
async function listUserShops(userId) {
  return getDb().select({ shop: shops, role: shopMembers.role }).from(shopMembers).innerJoin(shops, eq(shopMembers.shopId, shops.id)).where(eq(shopMembers.userId, userId));
}
async function getMembership(userId, shopId) {
  const rows = await getDb().select().from(shopMembers).where(and(eq(shopMembers.userId, userId), eq(shopMembers.shopId, shopId))).limit(1);
  return rows[0];
}

// server/_core/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/trpc.ts
var t = initTRPC.context().create({ transformer: superjson });
var router = t.router;
var publicProcedure = t.procedure;
var protectedProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);
var adminProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);

// server/routers/auth.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { eq as eq3 } from "drizzle-orm";
import { z } from "zod";

// server/auth.ts
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { parse } from "cookie";

// server/_core/cookies.ts
function isSecureRequest(req) {
  return req.secure || req.protocol === "https";
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(req)
  };
}

// server/auth.ts
var DEVELOPMENT_SESSION_SECRET = "development-secret-change-me";
function sessionSecret() {
  const configured = process.env.JWT_SECRET?.trim();
  if (!configured) {
    if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET is required in production");
    return new TextEncoder().encode(DEVELOPMENT_SESSION_SECRET);
  }
  return new TextEncoder().encode(configured);
}
async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}
async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
async function createSessionToken(userId) {
  return new SignJWT({ sub: userId, type: "easystor-session" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(sessionSecret());
}
async function getAuthenticatedUser(req) {
  const token = parse(req.headers.cookie ?? "")[COOKIE_NAME];
  if (!token) return null;
  try {
    const { payload: payload2 } = await jwtVerify(token, sessionSecret());
    if (!payload2.sub || payload2.type !== "easystor-session") return null;
    const user = await getUserById(payload2.sub);
    return user?.isActive ? user : null;
  } catch {
    return null;
  }
}
async function writeSessionCookie(req, res, userId) {
  const token = await createSessionToken(userId);
  res.cookie(COOKIE_NAME, token, {
    ...getSessionCookieOptions(req),
    maxAge: 30 * 24 * 60 * 60 * 1e3
  });
}
function clearSessionCookie(req, res) {
  res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(req), maxAge: -1 });
}

// server/authRateLimit.ts
import { createHash } from "node:crypto";
var MAX_ATTEMPTS = 5;
var WINDOW_MINUTES = 15;
function sourceIp(req) {
  return req.ip || req.socket.remoteAddress || "unknown";
}
function authRateLimitKey(req, scope, identifier) {
  return createHash("sha256").update(`${scope}\0${sourceIp(req)}\0${identifier.trim().toLowerCase()}`).digest("hex");
}
async function consumeAuthAttempt(req, scope, identifier) {
  const key = authRateLimitKey(req, scope, identifier);
  const rows = await rawRows(
    `INSERT INTO auth_rate_limits (key, attempt_count, window_started_at, blocked_until, updated_at)
     VALUES ($1, 1, now(), NULL, now())
     ON CONFLICT (key) DO UPDATE SET
       attempt_count = CASE
         WHEN auth_rate_limits.blocked_until IS NOT NULL AND auth_rate_limits.blocked_until > now() THEN auth_rate_limits.attempt_count
         WHEN auth_rate_limits.window_started_at <= now() - interval '15 minutes' THEN 1
         ELSE auth_rate_limits.attempt_count + 1
       END,
       window_started_at = CASE
         WHEN auth_rate_limits.window_started_at <= now() - interval '15 minutes' THEN now()
         ELSE auth_rate_limits.window_started_at
       END,
       blocked_until = CASE
         WHEN auth_rate_limits.blocked_until IS NOT NULL AND auth_rate_limits.blocked_until > now() THEN auth_rate_limits.blocked_until
         WHEN auth_rate_limits.window_started_at <= now() - interval '15 minutes' THEN NULL
         WHEN auth_rate_limits.attempt_count + 1 >= $2 THEN now() + interval '15 minutes'
         ELSE NULL
       END,
       updated_at = now()
     RETURNING blocked_until`,
    [key, MAX_ATTEMPTS]
  );
  return Boolean(rows[0]?.blocked_until && new Date(rows[0].blocked_until).valueOf() > Date.now());
}
async function clearAuthAttempts(req, scope, identifier) {
  await rawRows("DELETE FROM auth_rate_limits WHERE key = $1", [authRateLimitKey(req, scope, identifier)]);
}
var AUTH_RATE_LIMIT_MESSAGE = `Trop de tentatives. R\xE9essayez dans ${WINDOW_MINUTES} minutes.`;

// server/routers/helpers.ts
import { and as and2, eq as eq2 } from "drizzle-orm";
import { TRPCError as TRPCError2 } from "@trpc/server";
async function assertShopAccess(userId, shopId, allowedRoles) {
  const membership = await getMembership(userId, shopId);
  if (!membership) {
    throw new TRPCError2({
      code: "FORBIDDEN",
      message: "Vous n\u2019avez pas acc\xE8s \xE0 cette boutique."
    });
  }
  const [shop] = await getDb().select({ isActive: shops.isActive }).from(shops).where(eq2(shops.id, shopId)).limit(1);
  if (!shop?.isActive) {
    throw new TRPCError2({
      code: "FORBIDDEN",
      message: "Cette boutique est temporairement suspendue. Contactez le support EASYSTOR."
    });
  }
  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    throw new TRPCError2({
      code: "FORBIDDEN",
      message: "Votre r\xF4le ne permet pas cette action."
    });
  }
  return membership;
}
async function assertBusinessDayOpen(shopId, operationDate) {
  const businessDate2 = operationDate.toISOString().slice(0, 10);
  const [closure] = await getDb().select({ id: cashClosures.id }).from(cashClosures).where(
    and2(
      eq2(cashClosures.shopId, shopId),
      eq2(cashClosures.businessDate, businessDate2)
    )
  ).limit(1);
  if (closure)
    throw new TRPCError2({
      code: "CONFLICT",
      message: `La caisse du ${businessDate2} est d\xE9j\xE0 cl\xF4tur\xE9e. Enregistrez l\u2019op\xE9ration sur une nouvelle journ\xE9e.`
    });
}
function makeShopSlug(name) {
  const base = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 140) || "boutique";
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

// server/routers/auth.ts
var registerInput = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  password: z.string().min(10).max(160),
  shopName: z.string().trim().min(2).max(180),
  currency: z.enum(["XAF", "XOF", "NGN"]).default("XAF"),
  country: z.string().trim().length(3).default("CMR")
});
var authRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user),
  register: publicProcedure.input(registerInput).mutation(async ({ ctx, input }) => {
    const email = input.email.toLowerCase();
    if (await consumeAuthAttempt(ctx.req, "register", email)) throw new TRPCError3({ code: "TOO_MANY_REQUESTS", message: AUTH_RATE_LIMIT_MESSAGE });
    if (await getUserByEmail(email)) {
      throw new TRPCError3({ code: "BAD_REQUEST", message: "La cr\xE9ation de compte est impossible avec ces informations." });
    }
    const userId = crypto.randomUUID();
    const shopId = crypto.randomUUID();
    const passwordHash = await hashPassword(input.password);
    const shopSlug = makeShopSlug(input.shopName);
    const sql3 = getSql();
    await sql3.transaction([
      sql3`INSERT INTO users (id, name, email, password_hash, login_method) VALUES (${userId}, ${input.name}, ${email}, ${passwordHash}, 'password')`,
      sql3`INSERT INTO shops (id, name, slug, currency, country, created_by) VALUES (${shopId}, ${input.shopName}, ${shopSlug}, ${input.currency}, ${input.country.toUpperCase()}, ${userId})`,
      sql3`INSERT INTO shop_members (shop_id, user_id, role) VALUES (${shopId}, ${userId}, 'owner')`
    ]);
    await writeSessionCookie(ctx.req, ctx.res, userId);
    await clearAuthAttempts(ctx.req, "register", email);
    const user = await getUserById(userId);
    const shop = (await getDb().select().from(shops).where(eq3(shops.id, shopId)).limit(1))[0];
    return { user, shop, role: "owner" };
  }),
  login: publicProcedure.input(z.object({ email: z.string().email(), password: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    const email = input.email.toLowerCase();
    if (await consumeAuthAttempt(ctx.req, "login", email)) throw new TRPCError3({ code: "TOO_MANY_REQUESTS", message: AUTH_RATE_LIMIT_MESSAGE });
    const user = await getUserByEmail(email);
    if (!user?.passwordHash || !user.isActive || !await verifyPassword(input.password, user.passwordHash)) {
      throw new TRPCError3({ code: "UNAUTHORIZED", message: "Identifiants invalides." });
    }
    await getDb().update(users).set({ lastSignedIn: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq3(users.id, user.id));
    await writeSessionCookie(ctx.req, ctx.res, user.id);
    await clearAuthAttempts(ctx.req, "login", email);
    return { user: await getUserById(user.id), shops: await listUserShops(user.id) };
  }),
  logout: publicProcedure.mutation(({ ctx }) => {
    clearSessionCookie(ctx.req, ctx.res);
    return { success: true };
  })
});

// server/routers/catalog.ts
import { TRPCError as TRPCError4 } from "@trpc/server";
import { and as and3, asc, desc, eq as eq4, ilike } from "drizzle-orm";
import { z as z2 } from "zod";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  neonDatabaseUrl: process.env.NEON_DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  platformOwnerEmail: process.env.PLATFORM_OWNER_EMAIL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/storage.ts
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}

// server/routers/catalog.ts
var productInput = z2.object({
  shopId: z2.string().uuid(),
  name: z2.string().trim().min(1).max(240),
  reference: z2.string().trim().max(120).optional(),
  barcode: z2.string().trim().max(120).optional(),
  category: z2.string().trim().max(120).default("Sans cat\xE9gorie"),
  unit: z2.string().trim().max(24).default("unit\xE9"),
  purchasePrice: z2.coerce.number().min(0).default(0),
  salePrice: z2.coerce.number().min(0),
  wholesalePrice: z2.coerce.number().min(0).optional(),
  stockQuantity: z2.coerce.number().min(0).default(0),
  alertThreshold: z2.coerce.number().min(0).default(5)
});
var variantInput = z2.object({
  shopId: z2.string().uuid(),
  productId: z2.string().uuid(),
  name: z2.string().trim().min(1).max(180),
  attributes: z2.record(z2.string().trim().min(1).max(40), z2.string().trim().min(1).max(80)).default({}),
  reference: z2.string().trim().max(120).optional(),
  barcode: z2.string().trim().max(120).optional(),
  purchasePrice: z2.coerce.number().min(0).default(0),
  salePrice: z2.coerce.number().min(0),
  stockQuantity: z2.coerce.number().min(0).default(0),
  alertThreshold: z2.coerce.number().min(0).default(5)
});
function decodeImage(dataUrl) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([a-zA-Z0-9+/=]+)$/);
  if (!match) throw new TRPCError4({ code: "BAD_REQUEST", message: "Choisissez une image PNG, JPEG ou WebP valide." });
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length === 0 || bytes.length > 2 * 1024 * 1024) throw new TRPCError4({ code: "PAYLOAD_TOO_LARGE", message: "L\u2019image doit peser au maximum 2 Mo." });
  const extension = match[1] === "image/jpeg" ? "jpg" : match[1].slice("image/".length);
  return { bytes, contentType: match[1], extension };
}
var catalogRouter = router({
  products: router({
    list: protectedProcedure.input(z2.object({ shopId: z2.string().uuid(), search: z2.string().trim().max(120).optional() })).query(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId);
      const where = input.search ? and3(eq4(products.shopId, input.shopId), ilike(products.name, `%${input.search}%`)) : eq4(products.shopId, input.shopId);
      return getDb().select().from(products).where(where).orderBy(asc(products.name));
    }),
    create: protectedProcedure.input(productInput).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
      const [product] = await getDb().insert(products).values({
        ...input,
        reference: input.reference || null,
        barcode: input.barcode || null,
        wholesalePrice: input.wholesalePrice ?? null
      }).returning();
      if (product.stockQuantity > 0) {
        await getDb().insert(stockMovements).values({
          shopId: input.shopId,
          productId: product.id,
          createdBy: ctx.user.id,
          type: "opening",
          quantityDelta: product.stockQuantity,
          stockAfter: product.stockQuantity,
          reason: "Stock initial"
        });
      }
      return product;
    }),
    update: protectedProcedure.input(productInput.extend({ id: z2.string().uuid() })).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
      const [product] = await getDb().update(products).set({
        name: input.name,
        reference: input.reference || null,
        barcode: input.barcode || null,
        category: input.category,
        unit: input.unit,
        purchasePrice: input.purchasePrice,
        salePrice: input.salePrice,
        wholesalePrice: input.wholesalePrice ?? null,
        alertThreshold: input.alertThreshold,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(and3(eq4(products.id, input.id), eq4(products.shopId, input.shopId))).returning();
      if (!product) throw new TRPCError4({ code: "NOT_FOUND", message: "Produit introuvable." });
      return product;
    }),
    adjust: protectedProcedure.input(z2.object({ shopId: z2.string().uuid(), productId: z2.string().uuid(), delta: z2.coerce.number().refine((value) => value !== 0), kind: z2.enum(["restock", "adjustment"]).default("adjustment"), reason: z2.string().trim().min(2).max(240) })).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
      const rows = await rawRows(
        `WITH changed AS (
           UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = now()
           WHERE id = $2 AND shop_id = $3 AND stock_quantity + $1 >= 0
           RETURNING id, stock_quantity
         )
         INSERT INTO stock_movements (shop_id, product_id, created_by, type, quantity_delta, stock_after, reason)
         SELECT $3, id, $4, $6::stock_movement_type, $1, stock_quantity, $5 FROM changed
         RETURNING stock_after`,
        [input.delta, input.productId, input.shopId, ctx.user.id, input.reason, input.kind]
      );
      if (!rows[0]) throw new TRPCError4({ code: "BAD_REQUEST", message: "Ajustement impossible : stock insuffisant ou produit introuvable." });
      return rows[0];
    }),
    movements: protectedProcedure.input(z2.object({ shopId: z2.string().uuid(), productId: z2.string().uuid().optional() })).query(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId);
      const where = input.productId ? and3(eq4(stockMovements.shopId, input.shopId), eq4(stockMovements.productId, input.productId)) : eq4(stockMovements.shopId, input.shopId);
      return getDb().select().from(stockMovements).where(where).orderBy(desc(stockMovements.createdAt)).limit(100);
    }),
    uploadPhoto: protectedProcedure.input(z2.object({ shopId: z2.string().uuid(), targetId: z2.string().uuid(), target: z2.enum(["product", "variant"]), dataUrl: z2.string().max(3e6) })).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
      const db = getDb();
      const target = input.target === "product" ? (await db.select({ id: products.id }).from(products).where(and3(eq4(products.id, input.targetId), eq4(products.shopId, input.shopId))).limit(1))[0] : (await db.select({ id: productVariants.id }).from(productVariants).where(and3(eq4(productVariants.id, input.targetId), eq4(productVariants.shopId, input.shopId))).limit(1))[0];
      if (!target) throw new TRPCError4({ code: "NOT_FOUND", message: "\xC9l\xE9ment du catalogue introuvable." });
      const image = decodeImage(input.dataUrl);
      const stored = await storagePut(`shops/${input.shopId}/catalog/${input.target}/${input.targetId}.${image.extension}`, image.bytes, image.contentType);
      if (input.target === "product") await db.update(products).set({ photoUrl: stored.url, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(products.id, input.targetId));
      else await db.update(productVariants).set({ photoUrl: stored.url, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(productVariants.id, input.targetId));
      return stored;
    })
  }),
  variants: router({
    list: protectedProcedure.input(z2.object({ shopId: z2.string().uuid(), productId: z2.string().uuid().optional() })).query(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId);
      const where = input.productId ? and3(eq4(productVariants.shopId, input.shopId), eq4(productVariants.productId, input.productId)) : eq4(productVariants.shopId, input.shopId);
      return getDb().select().from(productVariants).where(where).orderBy(asc(productVariants.name));
    }),
    create: protectedProcedure.input(variantInput).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
      const db = getDb();
      const [parent] = await db.select({ id: products.id }).from(products).where(and3(eq4(products.id, input.productId), eq4(products.shopId, input.shopId))).limit(1);
      if (!parent) throw new TRPCError4({ code: "NOT_FOUND", message: "Produit parent introuvable." });
      const [variant] = await db.insert(productVariants).values({ ...input, reference: input.reference || null, barcode: input.barcode || null }).returning();
      if (variant.stockQuantity > 0) await db.insert(stockMovements).values({ shopId: input.shopId, productId: input.productId, productVariantId: variant.id, createdBy: ctx.user.id, type: "opening", quantityDelta: variant.stockQuantity, stockAfter: variant.stockQuantity, reason: "Stock initial de variante" });
      return variant;
    }),
    adjust: protectedProcedure.input(z2.object({ shopId: z2.string().uuid(), variantId: z2.string().uuid(), delta: z2.coerce.number().refine((value) => value !== 0), kind: z2.enum(["restock", "adjustment"]).default("adjustment"), reason: z2.string().trim().min(2).max(240) })).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
      const rows = await rawRows(
        `WITH changed AS (
           UPDATE product_variants SET stock_quantity = stock_quantity + $1, updated_at = now()
           WHERE id = $2 AND shop_id = $3 AND stock_quantity + $1 >= 0
           RETURNING id, product_id, stock_quantity
         )
         INSERT INTO stock_movements (shop_id, product_id, product_variant_id, created_by, type, quantity_delta, stock_after, reason)
         SELECT $3, product_id, id, $4, $6::stock_movement_type, $1, stock_quantity, $5 FROM changed
         RETURNING stock_after`,
        [input.delta, input.variantId, input.shopId, ctx.user.id, input.reason, input.kind]
      );
      if (!rows[0]) throw new TRPCError4({ code: "BAD_REQUEST", message: "Ajustement impossible : stock insuffisant ou variante introuvable." });
      return rows[0];
    })
  }),
  customers: router({
    list: protectedProcedure.input(z2.object({ shopId: z2.string().uuid() })).query(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId);
      return getDb().select().from(customers).where(eq4(customers.shopId, input.shopId)).orderBy(asc(customers.name));
    }),
    create: protectedProcedure.input(z2.object({ shopId: z2.string().uuid(), name: z2.string().trim().min(2).max(180), phone: z2.string().trim().max(48).optional(), note: z2.string().trim().max(1e3).optional() })).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId);
      const [customer] = await getDb().insert(customers).values({ ...input, phone: input.phone || null, note: input.note || null }).returning();
      return customer;
    })
  })
});

// server/routers/commerce.ts
import { TRPCError as TRPCError5 } from "@trpc/server";
import { and as and4, desc as desc2, eq as eq5, inArray, lt, lte } from "drizzle-orm";
import { z as z3 } from "zod";

// server/lib/commerce.ts
function sumPaid(breakdown) {
  return Number((Math.max(0, breakdown.cash ?? 0) + Math.max(0, breakdown.mobileMoney ?? 0)).toFixed(2));
}
function paymentMethodFor(total, paid, breakdown) {
  if (paid <= 0) return "credit";
  if (paid < total) return "mixed";
  if ((breakdown.cash ?? 0) > 0 && (breakdown.mobileMoney ?? 0) > 0) return "mixed";
  return (breakdown.mobileMoney ?? 0) > 0 ? "mobile_money" : "cash";
}
function money2(value) {
  return Number(value.toFixed(2));
}

// server/routers/commerce.ts
var checkoutInput = z3.object({
  shopId: z3.string().uuid(),
  customerId: z3.string().uuid().optional(),
  operationId: z3.string().uuid(),
  discountAmount: z3.coerce.number().min(0).default(0),
  payment: z3.object({ cash: z3.coerce.number().min(0).default(0), mobileMoney: z3.coerce.number().min(0).default(0) }),
  transactionCurrency: z3.string().trim().toUpperCase().min(3).max(8).default("XAF"),
  items: z3.array(z3.object({ productId: z3.string().uuid(), variantId: z3.string().uuid().optional(), quantity: z3.coerce.number().positive() })).min(1).max(100),
  soldAt: z3.coerce.date().optional(),
  dueDate: z3.coerce.date().optional()
});
var commerceRouter = router({
  sales: router({
    list: protectedProcedure.input(z3.object({ shopId: z3.string().uuid(), from: z3.coerce.date().optional(), to: z3.coerce.date().optional() })).query(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId);
      const conditions = [eq5(sales.shopId, input.shopId)];
      if (input.from) conditions.push((await import("drizzle-orm")).gte(sales.soldAt, input.from));
      if (input.to) conditions.push((await import("drizzle-orm")).lte(sales.soldAt, input.to));
      return getDb().select({ sale: sales, customerName: customers.name }).from(sales).leftJoin(customers, eq5(sales.customerId, customers.id)).where(and4(...conditions)).orderBy(desc2(sales.soldAt)).limit(200);
    }),
    checkout: protectedProcedure.input(checkoutInput).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId);
      await assertBusinessDayOpen(input.shopId, input.soldAt ?? /* @__PURE__ */ new Date());
      const db = getDb();
      const [shop] = await db.select({ currency: shops.currency }).from(shops).where(eq5(shops.id, input.shopId)).limit(1);
      if (!shop) throw new TRPCError5({ code: "NOT_FOUND", message: "Boutique introuvable." });
      const transactionCurrency = input.transactionCurrency;
      const soldAt = input.soldAt ?? /* @__PURE__ */ new Date();
      let exchangeRate = 1;
      if (transactionCurrency !== shop.currency) {
        const [currency] = await db.select({ isActive: shopCurrencies.isActive }).from(shopCurrencies).where(and4(eq5(shopCurrencies.shopId, input.shopId), eq5(shopCurrencies.currency, transactionCurrency))).limit(1);
        if (!currency?.isActive) throw new TRPCError5({ code: "BAD_REQUEST", message: "Cette devise n\u2019est pas active pour la boutique." });
        const [rate] = await db.select({ rateToBase: exchangeRates.rateToBase }).from(exchangeRates).where(and4(eq5(exchangeRates.shopId, input.shopId), eq5(exchangeRates.currency, transactionCurrency), lte(exchangeRates.effectiveAt, soldAt))).orderBy(desc2(exchangeRates.effectiveAt)).limit(1);
        if (!rate) throw new TRPCError5({ code: "BAD_REQUEST", message: "Aucun taux valide n\u2019est d\xE9fini pour cette devise \xE0 la date de vente." });
        exchangeRate = rate.rateToBase;
      }
      const [existing] = await db.select({ id: sales.id, saleNumber: sales.saleNumber }).from(sales).where(and4(eq5(sales.shopId, input.shopId), eq5(sales.operationId, input.operationId))).limit(1);
      if (existing) return { ...existing, replayed: true };
      const productIds = Array.from(new Set(input.items.map((item) => item.productId)));
      const activeProducts = await db.select().from(products).where(and4(eq5(products.shopId, input.shopId), inArray(products.id, productIds)));
      if (activeProducts.length !== productIds.length) throw new TRPCError5({ code: "BAD_REQUEST", message: "Un produit du panier est introuvable." });
      const byId = new Map(activeProducts.map((product) => [product.id, product]));
      const variantIds = Array.from(new Set(input.items.flatMap((item) => item.variantId ? [item.variantId] : [])));
      const activeVariants = variantIds.length ? await db.select().from(productVariants).where(and4(eq5(productVariants.shopId, input.shopId), inArray(productVariants.id, variantIds))) : [];
      if (activeVariants.length !== variantIds.length) throw new TRPCError5({ code: "BAD_REQUEST", message: "Une variante du panier est introuvable." });
      const variantById = new Map(activeVariants.map((variant) => [variant.id, variant]));
      for (const item of input.items) if (item.variantId && variantById.get(item.variantId)?.productId !== item.productId) throw new TRPCError5({ code: "BAD_REQUEST", message: "La variante ne correspond pas \xE0 son produit." });
      const subtotal = money2(input.items.reduce((total2, item) => total2 + (item.variantId ? variantById.get(item.variantId)?.salePrice ?? 0 : byId.get(item.productId)?.salePrice ?? 0) * item.quantity, 0));
      const transactionSubtotal = money2(subtotal / exchangeRate);
      const transactionDiscount = money2(input.discountAmount);
      const discountAmount = money2(transactionDiscount * exchangeRate);
      if (discountAmount > subtotal) throw new TRPCError5({ code: "BAD_REQUEST", message: "La remise d\xE9passe le montant de la vente." });
      const total = money2(subtotal - discountAmount);
      const transactionTotal = money2(total / exchangeRate);
      const transactionAmountPaid = sumPaid(input.payment);
      const amountPaid = money2(transactionAmountPaid * exchangeRate);
      if (amountPaid > total) throw new TRPCError5({ code: "BAD_REQUEST", message: "Le montant encaiss\xE9 d\xE9passe le total de la vente." });
      const creditAmount = money2(total - amountPaid);
      if (creditAmount > 0 && !input.customerId) throw new TRPCError5({ code: "BAD_REQUEST", message: "Un client est requis pour une vente \xE0 cr\xE9dit." });
      if (input.customerId) {
        const [customer] = await db.select({ id: customers.id }).from(customers).where(and4(eq5(customers.id, input.customerId), eq5(customers.shopId, input.shopId))).limit(1);
        if (!customer) throw new TRPCError5({ code: "BAD_REQUEST", message: "Le client ne correspond pas \xE0 cette boutique." });
      }
      const saleId = crypto.randomUUID();
      const saleNumber = `V-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replaceAll("-", "")}-${input.operationId.slice(0, 6).toUpperCase()}`;
      const rows = await rawRows(
        `WITH input_rows AS (
           SELECT * FROM jsonb_to_recordset($1::jsonb) AS row(product_id uuid, variant_id uuid, quantity numeric)
         ), input AS (
           SELECT product_id, variant_id, sum(quantity) AS quantity FROM input_rows GROUP BY product_id, variant_id
         ), locked_products AS (
           SELECT p.id AS product_id, NULL::uuid AS variant_id, p.name, p.sale_price, p.purchase_price, p.stock_quantity, i.quantity
           FROM products p JOIN input i ON i.product_id = p.id
           WHERE p.shop_id = $2 AND p.is_active = true AND i.variant_id IS NULL FOR UPDATE OF p
         ), locked_variants AS (
           SELECT p.id AS product_id, v.id AS variant_id, v.name, v.sale_price, v.purchase_price, v.stock_quantity, i.quantity
           FROM products p JOIN product_variants v ON v.product_id = p.id AND v.shop_id = p.shop_id
           JOIN input i ON i.product_id = p.id AND i.variant_id = v.id
           WHERE p.shop_id = $2 AND p.is_active = true AND v.is_active = true FOR UPDATE OF p, v
         ), locked AS (
           SELECT * FROM locked_products UNION ALL SELECT * FROM locked_variants
         ), guard AS (
           SELECT count(*) = (SELECT count(*) FROM input)
             AND coalesce(bool_and(stock_quantity >= quantity), false)
             AND coalesce(sum(sale_price * quantity), 0) >= $8 AS sufficient
           FROM locked
         ), new_sale AS (
           INSERT INTO sales (id, shop_id, customer_id, created_by, sale_number, operation_id, subtotal, discount_amount, total, amount_paid, credit_amount, payment_method, payment_breakdown, transaction_currency, exchange_rate, transaction_subtotal, transaction_discount_amount, transaction_total, transaction_amount_paid, transaction_payment_breakdown, sold_at)
           SELECT $3, $2, $4, $5, $6, $7, sum(l.sale_price * l.quantity), $8, sum(l.sale_price * l.quantity) - $8, $9, greatest(sum(l.sale_price * l.quantity) - $8 - $9, 0), $10::payment_method, $11::jsonb, $14, $15, $16, $17, $18, $19, $20::jsonb, $12
           FROM locked l CROSS JOIN guard g WHERE g.sufficient GROUP BY g.sufficient
           RETURNING id, credit_amount
         ), updated_products AS (
           UPDATE products p SET stock_quantity = p.stock_quantity - l.quantity, updated_at = now()
           FROM locked l, new_sale s WHERE p.id = l.product_id AND l.variant_id IS NULL RETURNING p.id AS product_id, NULL::uuid AS variant_id, p.stock_quantity
         ), updated_variants AS (
           UPDATE product_variants v SET stock_quantity = v.stock_quantity - l.quantity, updated_at = now()
           FROM locked l, new_sale s WHERE v.id = l.variant_id RETURNING v.product_id, v.id AS variant_id, v.stock_quantity
         ), updated_stock AS (
           SELECT * FROM updated_products UNION ALL SELECT * FROM updated_variants
         ), written_items AS (
           INSERT INTO sale_items (sale_id, product_id, product_variant_id, product_name, quantity, unit_price, purchase_price, line_total)
           SELECT s.id, l.product_id, l.variant_id, l.name, l.quantity, l.sale_price, l.purchase_price, l.sale_price * l.quantity FROM locked l CROSS JOIN new_sale s
         ), written_moves AS (
           INSERT INTO stock_movements (shop_id, product_id, product_variant_id, sale_id, created_by, type, quantity_delta, stock_after, reason)
           SELECT $2, l.product_id, l.variant_id, s.id, $5, 'sale', -l.quantity, u.stock_quantity, 'Vente POS'
           FROM locked l JOIN updated_stock u ON u.product_id = l.product_id AND u.variant_id IS NOT DISTINCT FROM l.variant_id CROSS JOIN new_sale s
         ), written_receivable AS (
           INSERT INTO receivables (shop_id, customer_id, sale_id, original_amount, balance, due_date)
           SELECT $2, $4, id, credit_amount, credit_amount, $13 FROM new_sale WHERE credit_amount > 0
         )
         SELECT (SELECT id FROM new_sale) AS sale_id, (SELECT sufficient FROM guard) AS sufficient`,
        [JSON.stringify(input.items.map((item) => ({ product_id: item.productId, variant_id: item.variantId ?? null, quantity: item.quantity }))), input.shopId, saleId, input.customerId ?? null, ctx.user.id, saleNumber, input.operationId, discountAmount, amountPaid, paymentMethodFor(total, amountPaid, { cash: money2(input.payment.cash * exchangeRate), mobileMoney: money2(input.payment.mobileMoney * exchangeRate) }), JSON.stringify({ cash: money2(input.payment.cash * exchangeRate), mobileMoney: money2(input.payment.mobileMoney * exchangeRate), rateToBase: exchangeRate }), soldAt, input.dueDate ?? null, transactionCurrency, exchangeRate, transactionSubtotal, transactionDiscount, transactionTotal, transactionAmountPaid, JSON.stringify(input.payment)]
      );
      const outcome = rows[0];
      if (!outcome?.sale_id || !outcome.sufficient) throw new TRPCError5({ code: "CONFLICT", message: "Stock insuffisant : la vente n\u2019a pas \xE9t\xE9 enregistr\xE9e." });
      return { id: outcome.sale_id, saleNumber, replayed: false, total, creditAmount };
    })
  }),
  receivables: router({
    list: protectedProcedure.input(z3.object({ shopId: z3.string().uuid(), includeSettled: z3.boolean().optional(), status: z3.enum(["open", "settled", "all"]).optional(), overdueOnly: z3.boolean().default(false) })).query(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId);
      const status = input.status ?? (input.includeSettled ? "all" : "open");
      const conditions = [eq5(receivables.shopId, input.shopId)];
      if (status === "open") conditions.push(eq5(receivables.isSettled, false));
      if (status === "settled") conditions.push(eq5(receivables.isSettled, true));
      if (input.overdueOnly) conditions.push(and4(eq5(receivables.isSettled, false), lt(receivables.dueDate, /* @__PURE__ */ new Date())));
      return getDb().select({ receivable: receivables, customerName: customers.name }).from(receivables).innerJoin(customers, eq5(receivables.customerId, customers.id)).where(and4(...conditions)).orderBy(desc2(receivables.createdAt));
    }),
    repay: protectedProcedure.input(z3.object({ shopId: z3.string().uuid(), receivableId: z3.string().uuid(), amount: z3.coerce.number().positive(), operationId: z3.string().uuid(), paymentMethod: z3.enum(["cash", "mobile_money"]).default("cash") })).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId);
      await assertBusinessDayOpen(input.shopId, /* @__PURE__ */ new Date());
      const rows = await rawRows(
        `WITH updated AS (
           UPDATE receivables SET balance = balance - $1, is_settled = balance - $1 <= 0, updated_at = now()
           WHERE id = $2 AND shop_id = $3 AND balance >= $1 RETURNING id, balance, is_settled
         ), written AS (
           INSERT INTO repayments (shop_id, receivable_id, created_by, operation_id, amount, payment_method)
           SELECT $3, id, $4, $5, $1, $6::payment_method FROM updated
         ) SELECT * FROM updated`,
        [input.amount, input.receivableId, input.shopId, ctx.user.id, input.operationId, input.paymentMethod]
      );
      if (!rows[0]) throw new TRPCError5({ code: "BAD_REQUEST", message: "Remboursement impossible : montant ou cr\xE9ance invalide." });
      return rows[0];
    })
  }),
  expenses: router({
    list: protectedProcedure.input(z3.object({ shopId: z3.string().uuid(), from: z3.coerce.date().optional(), to: z3.coerce.date().optional() })).query(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
      const conditions = [eq5(expenses.shopId, input.shopId)];
      if (input.from) conditions.push((await import("drizzle-orm")).gte(expenses.spentAt, input.from));
      if (input.to) conditions.push((await import("drizzle-orm")).lte(expenses.spentAt, input.to));
      return getDb().select().from(expenses).where(and4(...conditions)).orderBy(desc2(expenses.spentAt)).limit(100);
    }),
    create: protectedProcedure.input(z3.object({ shopId: z3.string().uuid(), category: z3.string().trim().min(2).max(120), amount: z3.coerce.number().positive(), note: z3.string().trim().max(1e3).optional(), operationId: z3.string().uuid() })).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
      await assertBusinessDayOpen(input.shopId, /* @__PURE__ */ new Date());
      const [expense] = await getDb().insert(expenses).values({ ...input, createdBy: ctx.user.id, note: input.note || null }).returning();
      return expense;
    })
  })
});

// server/routers/closing.ts
import { and as and5, desc as desc3, eq as eq6 } from "drizzle-orm";
import { z as z4 } from "zod";

// server/lib/closing.ts
function closingDifference(expectedCash, declaredCash) {
  return Math.round((declaredCash - expectedCash) * 100) / 100;
}
function formatBusinessDate(date2) {
  return date2.toISOString().slice(0, 10);
}

// server/routers/closing.ts
var businessDate = z4.string().regex(/^\d{4}-\d{2}-\d{2}$/);
async function summaryFor(shopId, date2) {
  const rows = await rawRows(
    `WITH sale_totals AS (
       SELECT count(*)::int AS sale_count, COALESCE(sum(total), 0) AS turnover,
              COALESCE(sum((payment_breakdown->>'cash')::numeric), 0) AS cash_sales,
              COALESCE(sum((payment_breakdown->>'mobileMoney')::numeric), 0) AS mobile_sales,
              COALESCE(sum(credit_amount), 0) AS credit_sales
       FROM sales WHERE shop_id = $1 AND status = 'completed' AND sold_at::date = $2::date
     ), repayment_totals AS (
       SELECT COALESCE(sum(amount) FILTER (WHERE payment_method = 'cash'), 0) AS cash_repayments,
              COALESCE(sum(amount) FILTER (WHERE payment_method = 'mobile_money'), 0) AS mobile_repayments
       FROM repayments WHERE shop_id = $1 AND paid_at::date = $2::date
     ), expense_totals AS (
       SELECT COALESCE(sum(amount), 0) AS expenses FROM expenses WHERE shop_id = $1 AND spent_at::date = $2::date
     )
     SELECT sale_count, turnover, cash_sales, mobile_sales, credit_sales, cash_repayments, mobile_repayments, expenses,
            cash_sales + cash_repayments - expenses AS expected_cash
     FROM sale_totals CROSS JOIN repayment_totals CROSS JOIN expense_totals`,
    [shopId, date2]
  );
  const result = rows[0] ?? { sale_count: 0, turnover: 0, cash_sales: 0, mobile_sales: 0, credit_sales: 0, cash_repayments: 0, mobile_repayments: 0, expenses: 0, expected_cash: 0 };
  return Object.fromEntries(Object.entries(result).map(([key, value]) => [key, Number(value ?? 0)]));
}
var closingRouter = router({
  preview: protectedProcedure.input(z4.object({ shopId: z4.string().uuid(), businessDate: businessDate.default(() => formatBusinessDate(/* @__PURE__ */ new Date())) })).query(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
    const summary = await summaryFor(input.shopId, input.businessDate);
    const [existing] = await getDb().select().from(cashClosures).where(and5(eq6(cashClosures.shopId, input.shopId), eq6(cashClosures.businessDate, input.businessDate))).limit(1);
    return { businessDate: input.businessDate, ...summary, closure: existing ?? null };
  }),
  list: protectedProcedure.input(z4.object({ shopId: z4.string().uuid() })).query(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
    return getDb().select().from(cashClosures).where(eq6(cashClosures.shopId, input.shopId)).orderBy(desc3(cashClosures.businessDate)).limit(31);
  }),
  close: protectedProcedure.input(z4.object({ shopId: z4.string().uuid(), businessDate, declaredCash: z4.coerce.number().min(0) })).mutation(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
    const summary = await summaryFor(input.shopId, input.businessDate);
    const difference = closingDifference(summary.expected_cash, input.declaredCash);
    const rows = await rawRows(
      `INSERT INTO cash_closures (shop_id, business_date, expected_cash, declared_cash, difference, snapshot, closed_by)
       VALUES ($1, $2::date, $3, $4, $5, $6::jsonb, $7)
       ON CONFLICT (shop_id, business_date) DO NOTHING RETURNING id`,
      [input.shopId, input.businessDate, summary.expected_cash, input.declaredCash, difference, JSON.stringify(summary), ctx.user.id]
    );
    const [closure] = await getDb().select().from(cashClosures).where(and5(eq6(cashClosures.shopId, input.shopId), eq6(cashClosures.businessDate, input.businessDate))).limit(1);
    if (!closure) throw new Error("La fermeture de caisse n\u2019a pas pu \xEAtre enregistr\xE9e.");
    return { closure, summary, replayed: rows.length === 0 };
  })
});

// server/routers/insights.ts
import { z as z5 } from "zod";
var numberValue = (value) => Number(value ?? 0);
var insightsRouter = router({
  dashboard: protectedProcedure.input(z5.object({ shopId: z5.string().uuid() })).query(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId);
    const sql3 = getSql();
    const [totals, lowStock, debts, trend, lowStockItems, overdueReceivables] = await sql3.transaction([
      sql3`SELECT COALESCE(SUM(total) FILTER (WHERE sold_at::date = CURRENT_DATE), 0) AS sales_today,
                 COALESCE(SUM(total) FILTER (WHERE sold_at::date = CURRENT_DATE - INTERVAL '1 day'), 0) AS sales_yesterday,
                 COALESCE(SUM((payment_breakdown->>'cash')::numeric) FILTER (WHERE sold_at::date = CURRENT_DATE), 0) AS cash_today,
                 COALESCE(SUM((payment_breakdown->>'mobileMoney')::numeric) FILTER (WHERE sold_at::date = CURRENT_DATE), 0) AS mobile_today
          FROM sales WHERE shop_id = ${input.shopId} AND status = 'completed'`,
      sql3`SELECT count(*)::int AS count FROM products WHERE shop_id = ${input.shopId} AND is_active = true AND stock_quantity <= alert_threshold`,
      sql3`SELECT COALESCE(SUM(balance), 0) AS outstanding FROM receivables WHERE shop_id = ${input.shopId} AND is_settled = false`,
      sql3`SELECT to_char(day, 'Dy') AS label, COALESCE(SUM(s.total), 0) AS value
          FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') AS day
          LEFT JOIN sales s ON s.shop_id = ${input.shopId} AND s.status = 'completed' AND s.sold_at::date = day::date
          GROUP BY day ORDER BY day`,
      sql3`SELECT id, name, stock_quantity, alert_threshold FROM products
          WHERE shop_id = ${input.shopId} AND is_active = true AND stock_quantity <= alert_threshold
          ORDER BY stock_quantity ASC, name ASC LIMIT 5`,
      sql3`SELECT r.id, c.name AS customer_name, r.balance, r.due_date FROM receivables r
          JOIN customers c ON c.id = r.customer_id
          WHERE r.shop_id = ${input.shopId} AND r.is_settled = false AND r.due_date IS NOT NULL AND r.due_date < now()
          ORDER BY r.due_date ASC LIMIT 5`
    ]);
    return {
      salesToday: numberValue(totals[0]?.sales_today),
      salesYesterday: numberValue(totals[0]?.sales_yesterday),
      cashToday: numberValue(totals[0]?.cash_today),
      mobileToday: numberValue(totals[0]?.mobile_today),
      lowStockCount: numberValue(lowStock[0]?.count),
      outstandingReceivables: numberValue(debts[0]?.outstanding),
      trend: trend.map((row) => ({ label: String(row.label), value: numberValue(row.value) })),
      lowStockItems: lowStockItems.map((row) => ({ id: String(row.id), name: String(row.name), stockQuantity: numberValue(row.stock_quantity), alertThreshold: numberValue(row.alert_threshold) })),
      overdueReceivables: overdueReceivables.map((row) => ({ id: String(row.id), customerName: String(row.customer_name), balance: numberValue(row.balance), dueDate: new Date(String(row.due_date)) }))
    };
  }),
  report: protectedProcedure.input(z5.object({ shopId: z5.string().uuid(), from: z5.coerce.date(), to: z5.coerce.date() })).query(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
    const sql3 = getSql();
    const [summary, topProducts] = await sql3.transaction([
      sql3`SELECT COALESCE(SUM(s.total), 0) AS turnover,
                 COALESCE(SUM(s.total - si.purchase_price * si.quantity), 0) AS gross_margin,
                 COUNT(DISTINCT s.id)::int AS sale_count
          FROM sales s LEFT JOIN sale_items si ON si.sale_id = s.id
          WHERE s.shop_id = ${input.shopId} AND s.status = 'completed' AND s.sold_at >= ${input.from} AND s.sold_at <= ${input.to}`,
      sql3`SELECT si.product_name AS name, SUM(si.quantity) AS quantity, SUM(si.line_total) AS revenue
          FROM sale_items si JOIN sales s ON s.id = si.sale_id
          WHERE s.shop_id = ${input.shopId} AND s.status = 'completed' AND s.sold_at >= ${input.from} AND s.sold_at <= ${input.to}
          GROUP BY si.product_name ORDER BY revenue DESC LIMIT 10`
    ]);
    return {
      turnover: numberValue(summary[0]?.turnover),
      grossMargin: numberValue(summary[0]?.gross_margin),
      saleCount: numberValue(summary[0]?.sale_count),
      topProducts: topProducts.map((row) => ({ name: String(row.name), quantity: numberValue(row.quantity), revenue: numberValue(row.revenue) }))
    };
  })
});

// server/routers/migration.ts
import { TRPCError as TRPCError6 } from "@trpc/server";
import { and as and6, eq as eq7, inArray as inArray2 } from "drizzle-orm";
import { createHash as createHash2 } from "node:crypto";
import { z as z6 } from "zod";

// shared/importLimits.ts
var MAX_IMPORT_FILE_BYTES = 2 * 1024 * 1024;
var MAX_IMPORT_PAYLOAD_BYTES = 2 * 1024 * 1024;
var API_BODY_LIMIT = "4mb";
function serializedByteLength(value) {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

// server/routers/migration.ts
var sourceId = z6.string().trim().min(1).max(70);
var productRow = z6.object({ sourceId, name: z6.string().trim().min(1).max(240), barcode: z6.string().trim().max(120).optional(), reference: z6.string().trim().max(120).optional(), category: z6.string().trim().max(120).optional(), unit: z6.string().trim().max(24).optional(), salePrice: z6.coerce.number().min(0), purchasePrice: z6.coerce.number().min(0).default(0), stockQuantity: z6.coerce.number().min(0).default(0), alertThreshold: z6.coerce.number().min(0).default(5) });
var customerRow = z6.object({ sourceId, name: z6.string().trim().min(1).max(180), phone: z6.string().trim().max(48).optional(), note: z6.string().trim().max(1e3).optional() });
var supplierRow = z6.object({ sourceId, name: z6.string().trim().min(1).max(180), reference: z6.string().trim().max(80).optional(), contactName: z6.string().trim().max(180).optional(), phone: z6.string().trim().max(48).optional(), email: z6.string().trim().email().max(320).optional(), city: z6.string().trim().max(120).optional(), deliveryLeadDays: z6.coerce.number().int().min(0).max(365).optional(), paymentTerms: z6.string().trim().max(120).optional() });
var saleRow = z6.object({ sourceId, reference: z6.string().trim().max(40).optional(), soldAt: z6.coerce.date(), customerName: z6.string().trim().max(180).optional(), total: z6.coerce.number().positive(), cash: z6.coerce.number().min(0).default(0), mobileMoney: z6.coerce.number().min(0).default(0), discountAmount: z6.coerce.number().min(0).default(0), dueDate: z6.coerce.date().optional() });
var saleItemRow = z6.object({ sourceId, saleReference: z6.string().trim().min(1).max(40), productName: z6.string().trim().min(1).max(240), barcode: z6.string().trim().max(120).optional(), quantity: z6.coerce.number().positive(), unitPrice: z6.coerce.number().min(0), purchasePrice: z6.coerce.number().min(0).default(0) });
var purchaseRow = z6.object({ sourceId, reference: z6.string().trim().min(1).max(80), purchasedAt: z6.coerce.date(), supplierName: z6.string().trim().max(180).optional(), status: z6.enum(["received", "pending"]), paymentMethod: z6.string().trim().max(48).optional(), subtotal: z6.coerce.number().min(0).default(0), taxAmount: z6.coerce.number().min(0).default(0), total: z6.coerce.number().positive(), receivedAt: z6.coerce.date().optional() });
var purchaseItemRow = z6.object({ sourceId, purchaseReference: z6.string().trim().min(1).max(80), productName: z6.string().trim().min(1).max(240), barcode: z6.string().trim().max(120).optional(), quantity: z6.coerce.number().positive(), unitPrice: z6.coerce.number().min(0) });
var expenseRow = z6.object({ sourceId, category: z6.string().trim().min(1).max(120), amount: z6.coerce.number().positive(), note: z6.string().trim().max(1e3).optional(), spentAt: z6.coerce.date() });
var payload = z6.object({ products: z6.array(productRow).max(1e3).default([]), customers: z6.array(customerRow).max(1e3).default([]), suppliers: z6.array(supplierRow).max(1e3).default([]), sales: z6.array(saleRow).max(1e3).default([]), saleItems: z6.array(saleItemRow).max(5e3).default([]), purchases: z6.array(purchaseRow).max(1e3).default([]), purchaseItems: z6.array(purchaseItemRow).max(5e3).default([]), expenses: z6.array(expenseRow).max(1e3).default([]) }).superRefine((value, ctx) => {
  if (serializedByteLength(value) > MAX_IMPORT_PAYLOAD_BYTES) ctx.addIssue({ code: "custom", message: "Les donn\xE9es d\u2019import d\xE9passent la limite s\xE9curis\xE9e de 2 Mo." });
});
var conflictStrategy = z6.enum(["skip", "update", "copy", "block"]);
var normal = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
var dateKey = (value) => value.toISOString().slice(0, 10);
var fingerprint = (data) => createHash2("sha256").update(JSON.stringify(data)).digest("hex");
var operation = (kind, fileHash, value) => `import-${kind}-${fileHash.slice(0, 18)}-${value}`.slice(0, 96);
async function detectConflicts(shopId, data, fileHash) {
  const db = getDb();
  const dates = Array.from(new Set(data.sales.map((row) => dateKey(row.soldAt)).concat(data.expenses.map((row) => dateKey(row.spentAt)))));
  const saleRefs = data.sales.map((row) => row.reference).filter((value) => Boolean(value));
  const purchaseRefs = data.purchases.map((row) => row.reference);
  const [knownProducts, knownCustomers, knownSuppliers, knownSales, knownPurchases, closedDays, imported] = await Promise.all([
    db.select({ id: products.id, name: products.name, barcode: products.barcode }).from(products).where(eq7(products.shopId, shopId)),
    db.select({ id: customers.id, name: customers.name, phone: customers.phone }).from(customers).where(eq7(customers.shopId, shopId)),
    db.select({ id: suppliers.id, name: suppliers.name, email: suppliers.email }).from(suppliers).where(eq7(suppliers.shopId, shopId)),
    saleRefs.length ? db.select({ saleNumber: sales.saleNumber }).from(sales).where(and6(eq7(sales.shopId, shopId), inArray2(sales.saleNumber, saleRefs))) : Promise.resolve([]),
    purchaseRefs.length ? db.select({ purchaseNumber: purchases.purchaseNumber }).from(purchases).where(and6(eq7(purchases.shopId, shopId), inArray2(purchases.purchaseNumber, purchaseRefs))) : Promise.resolve([]),
    dates.length ? db.select({ businessDate: cashClosures.businessDate }).from(cashClosures).where(and6(eq7(cashClosures.shopId, shopId), inArray2(cashClosures.businessDate, dates))) : Promise.resolve([]),
    db.select({ id: dataImports.id }).from(dataImports).where(and6(eq7(dataImports.shopId, shopId), eq7(dataImports.fingerprint, fileHash))).limit(1)
  ]);
  const productNames = new Set(knownProducts.map((row) => normal(row.name)));
  const productBarcodes = new Set(knownProducts.map((row) => row.barcode).filter(Boolean));
  const customerNames = new Set(knownCustomers.map((row) => normal(row.name)));
  const customerPhones = new Set(knownCustomers.map((row) => row.phone).filter(Boolean));
  const supplierNames = new Set(knownSuppliers.map((row) => normal(row.name)));
  const supplierEmails = new Set(knownSuppliers.map((row) => row.email).filter(Boolean));
  const salesByNumber = new Set(knownSales.map((row) => row.saleNumber));
  const purchasesByNumber = new Set(knownPurchases.map((row) => row.purchaseNumber));
  const closed = new Set(closedDays.map((row) => row.businessDate));
  const seenProducts = /* @__PURE__ */ new Set();
  const seenCustomers = /* @__PURE__ */ new Set();
  const seenSuppliers = /* @__PURE__ */ new Set();
  const seenPurchases = /* @__PURE__ */ new Set();
  const conflicts = [];
  if (imported[0]) conflicts.push({ type: "reimport", sourceId: "fichier", reason: "Ce m\xEAme contenu a d\xE9j\xE0 \xE9t\xE9 import\xE9 pour cette boutique." });
  for (const item of data.products) {
    const key = item.barcode ? `barcode:${item.barcode}` : `name:${normal(item.name)}`;
    if (seenProducts.has(key) || item.barcode && productBarcodes.has(item.barcode) || productNames.has(normal(item.name))) conflicts.push({ type: "product", sourceId: item.sourceId, reason: item.barcode && productBarcodes.has(item.barcode) ? "Code-barres d\xE9j\xE0 pr\xE9sent" : "Produit d\xE9j\xE0 pr\xE9sent ou r\xE9p\xE9t\xE9 dans le fichier" });
    seenProducts.add(key);
  }
  for (const item of data.customers) {
    const key = item.phone ? `phone:${item.phone}` : `name:${normal(item.name)}`;
    if (seenCustomers.has(key) || item.phone && customerPhones.has(item.phone) || customerNames.has(normal(item.name))) conflicts.push({ type: "customer", sourceId: item.sourceId, reason: item.phone && customerPhones.has(item.phone) ? "T\xE9l\xE9phone d\xE9j\xE0 pr\xE9sent" : "Client d\xE9j\xE0 pr\xE9sent ou r\xE9p\xE9t\xE9 dans le fichier" });
    seenCustomers.add(key);
  }
  for (const item of data.suppliers) {
    const key = item.email ? `email:${item.email}` : `name:${normal(item.name)}`;
    if (seenSuppliers.has(key) || item.email && supplierEmails.has(item.email) || supplierNames.has(normal(item.name))) conflicts.push({ type: "supplier", sourceId: item.sourceId, reason: item.email && supplierEmails.has(item.email) ? "E-mail fournisseur d\xE9j\xE0 pr\xE9sent" : "Fournisseur d\xE9j\xE0 pr\xE9sent ou r\xE9p\xE9t\xE9 dans le fichier" });
    seenSuppliers.add(key);
  }
  for (const item of data.sales) {
    if (item.reference && salesByNumber.has(item.reference)) conflicts.push({ type: "sale", sourceId: item.sourceId, reason: "R\xE9f\xE9rence de vente d\xE9j\xE0 pr\xE9sente" });
    if (closed.has(dateKey(item.soldAt))) conflicts.push({ type: "business_day", sourceId: item.sourceId, reason: `La caisse du ${dateKey(item.soldAt)} est d\xE9j\xE0 cl\xF4tur\xE9e` });
  }
  const fileSupplierNames = new Set(data.suppliers.map((item) => normal(item.name)));
  for (const item of data.purchases) {
    if (seenPurchases.has(item.reference) || purchasesByNumber.has(item.reference)) conflicts.push({ type: "purchase", sourceId: item.sourceId, reason: "R\xE9f\xE9rence d\u2019achat d\xE9j\xE0 pr\xE9sente ou r\xE9p\xE9t\xE9e dans le fichier" });
    if (item.supplierName && !supplierNames.has(normal(item.supplierName)) && !fileSupplierNames.has(normal(item.supplierName))) conflicts.push({ type: "purchase", sourceId: item.sourceId, reason: `Le fournisseur ${item.supplierName} est introuvable dans l\u2019onglet Fournisseurs` });
    seenPurchases.add(item.reference);
  }
  const fileSaleReferences = new Set(data.sales.map((item) => item.reference).filter((value) => Boolean(value)));
  for (const item of data.saleItems) if (!fileSaleReferences.has(item.saleReference)) conflicts.push({ type: "sale", sourceId: item.sourceId, reason: `La vente ${item.saleReference} est introuvable dans le fichier` });
  const filePurchaseReferences = new Set(data.purchases.map((item) => item.reference));
  for (const item of data.purchaseItems) if (!filePurchaseReferences.has(item.purchaseReference)) conflicts.push({ type: "purchase", sourceId: item.sourceId, reason: `L\u2019achat ${item.purchaseReference} est introuvable dans le fichier` });
  const fileProductNames = new Set(data.products.map((item) => normal(item.name)));
  const fileProductBarcodes = new Set(data.products.map((item) => item.barcode).filter(Boolean));
  for (const item of data.saleItems) if ((!item.barcode || !fileProductBarcodes.has(item.barcode)) && !fileProductNames.has(normal(item.productName))) conflicts.push({ type: "product", sourceId: item.sourceId, reason: `Ajoutez ${item.productName} dans l\u2019onglet Produits avec son stock final avant d\u2019importer ses ventes d\xE9taill\xE9es` });
  for (const item of data.purchaseItems) if ((!item.barcode || !fileProductBarcodes.has(item.barcode)) && !fileProductNames.has(normal(item.productName))) conflicts.push({ type: "product", sourceId: item.sourceId, reason: `Ajoutez ${item.productName} dans l\u2019onglet Produits pour rattacher cette ligne d\u2019achat` });
  for (const product of data.products) if (conflicts.some((row) => row.type === "product" && row.sourceId === product.sourceId)) {
    for (const line of data.saleItems) if (line.barcode && product.barcode === line.barcode || normal(line.productName) === normal(product.name)) conflicts.push({ type: "product", sourceId: line.sourceId, reason: `Le produit ${product.name} existe d\xE9j\xE0 : choisissez \xAB Cr\xE9er une copie \xBB pour reconstituer son historique d\xE9taill\xE9 sans modifier son stock actuel` });
  }
  for (const item of data.expenses) if (closed.has(dateKey(item.spentAt))) conflicts.push({ type: "business_day", sourceId: item.sourceId, reason: `La caisse du ${dateKey(item.spentAt)} est d\xE9j\xE0 cl\xF4tur\xE9e` });
  return conflicts;
}
var migrationRouter = router({
  exportData: protectedProcedure.input(z6.object({ shopId: z6.string().uuid() })).query(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
    const db = getDb();
    const [productRows, variantRows, customerRows, supplierRows, saleRows, lineRows, purchaseRows, purchaseLineRows, expenseRows, receivableRows, repaymentRows, closureRows, movementRows, currencyRows, rateRows] = await Promise.all([
      db.select().from(products).where(eq7(products.shopId, input.shopId)),
      db.select().from(productVariants).where(eq7(productVariants.shopId, input.shopId)),
      db.select().from(customers).where(eq7(customers.shopId, input.shopId)),
      db.select().from(suppliers).where(eq7(suppliers.shopId, input.shopId)),
      db.select({ sale: sales, customerName: customers.name }).from(sales).leftJoin(customers, eq7(sales.customerId, customers.id)).where(eq7(sales.shopId, input.shopId)),
      db.select({ line: saleItems, saleNumber: sales.saleNumber, productBarcode: products.barcode }).from(saleItems).innerJoin(sales, eq7(saleItems.saleId, sales.id)).leftJoin(products, eq7(saleItems.productId, products.id)).where(eq7(sales.shopId, input.shopId)),
      db.select({ purchase: purchases, supplierName: suppliers.name }).from(purchases).leftJoin(suppliers, eq7(purchases.supplierId, suppliers.id)).where(eq7(purchases.shopId, input.shopId)),
      db.select({ line: purchaseItems, purchaseNumber: purchases.purchaseNumber, productBarcode: products.barcode }).from(purchaseItems).innerJoin(purchases, eq7(purchaseItems.purchaseId, purchases.id)).leftJoin(products, eq7(purchaseItems.productId, products.id)).where(eq7(purchases.shopId, input.shopId)),
      db.select().from(expenses).where(eq7(expenses.shopId, input.shopId)),
      db.select({ receivable: receivables, customerName: customers.name, saleNumber: sales.saleNumber }).from(receivables).innerJoin(customers, eq7(receivables.customerId, customers.id)).innerJoin(sales, eq7(receivables.saleId, sales.id)).where(eq7(receivables.shopId, input.shopId)),
      db.select({ repayment: repayments, customerName: customers.name, saleNumber: sales.saleNumber }).from(repayments).innerJoin(receivables, eq7(repayments.receivableId, receivables.id)).innerJoin(customers, eq7(receivables.customerId, customers.id)).innerJoin(sales, eq7(receivables.saleId, sales.id)).where(eq7(repayments.shopId, input.shopId)),
      db.select().from(cashClosures).where(eq7(cashClosures.shopId, input.shopId)),
      db.select({ movement: stockMovements, productName: products.name }).from(stockMovements).innerJoin(products, eq7(stockMovements.productId, products.id)).where(eq7(stockMovements.shopId, input.shopId)),
      db.select().from(shopCurrencies).where(eq7(shopCurrencies.shopId, input.shopId)),
      db.select().from(exchangeRates).where(eq7(exchangeRates.shopId, input.shopId))
    ]);
    return { products: productRows, variants: variantRows, customers: customerRows, suppliers: supplierRows, sales: saleRows, saleItems: lineRows, purchases: purchaseRows, purchaseItems: purchaseLineRows, expenses: expenseRows, receivables: receivableRows, repayments: repaymentRows, closures: closureRows, stockMovements: movementRows, currencies: currencyRows, exchangeRates: rateRows };
  }),
  preview: protectedProcedure.input(z6.object({ shopId: z6.string().uuid(), data: payload })).mutation(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
    const fileHash = fingerprint(input.data);
    const conflicts = await detectConflicts(input.shopId, input.data, fileHash);
    return { fingerprint: fileHash, totals: { products: input.data.products.length, customers: input.data.customers.length, suppliers: input.data.suppliers.length, sales: input.data.sales.length, saleItems: input.data.saleItems.length, purchases: input.data.purchases.length, purchaseItems: input.data.purchaseItems.length, expenses: input.data.expenses.length }, conflicts, importable: input.data.products.length + input.data.customers.length + input.data.suppliers.length + input.data.sales.length + input.data.saleItems.length + input.data.purchases.length + input.data.purchaseItems.length + input.data.expenses.length - conflicts.length };
  }),
  run: protectedProcedure.input(z6.object({ shopId: z6.string().uuid(), fileName: z6.string().trim().min(1).max(240), data: payload, conflictStrategy })).mutation(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
    const db = getDb();
    const fileHash = fingerprint(input.data);
    const conflicts = await detectConflicts(input.shopId, input.data, fileHash);
    if (conflicts.some((row) => row.type === "reimport")) return { replayed: true, imported: { products: 0, customers: 0, suppliers: 0, sales: 0, saleItems: 0, purchases: 0, purchaseItems: 0, expenses: 0 }, skipped: 0, conflicts };
    if (conflicts.some((row) => row.type === "business_day")) throw new TRPCError6({ code: "CONFLICT", message: "L\u2019import contient une op\xE9ration dat\xE9e sur une journ\xE9e d\xE9j\xE0 cl\xF4tur\xE9e. Corrigez le fichier ou choisissez une autre boutique." });
    const lineProductConflicts = conflicts.filter((row) => row.type === "product" && input.data.saleItems.some((item) => item.sourceId === row.sourceId));
    const purchaseLineProductConflicts = conflicts.filter((row) => row.type === "product" && input.data.purchaseItems.some((item) => item.sourceId === row.sourceId));
    if (lineProductConflicts.some((row) => row.reason.startsWith("Ajoutez"))) throw new TRPCError6({ code: "BAD_REQUEST", message: "Chaque ligne de vente d\xE9taill\xE9e doit avoir un produit correspondant dans l\u2019onglet Produits, avec son stock final." });
    if (purchaseLineProductConflicts.some((row) => row.reason.startsWith("Ajoutez"))) throw new TRPCError6({ code: "BAD_REQUEST", message: "Chaque ligne d\u2019achat d\xE9taill\xE9e doit avoir un produit correspondant dans l\u2019onglet Produits." });
    if (lineProductConflicts.length && input.conflictStrategy !== "copy") throw new TRPCError6({ code: "CONFLICT", message: "Une vente d\xE9taill\xE9e vise un produit existant. Choisissez \xAB Cr\xE9er une copie \xBB pour conserver le stock actuel et reconstituer l\u2019historique s\xE9par\xE9ment." });
    if (input.conflictStrategy === "block" && conflicts.length) throw new TRPCError6({ code: "CONFLICT", message: "Des collisions ont \xE9t\xE9 d\xE9tect\xE9es. Choisissez ignorer, mettre \xE0 jour ou cr\xE9er une copie." });
    const blocked = new Set(conflicts.filter((row) => row.type === "sale" || row.type === "purchase" || input.conflictStrategy === "skip" && (row.type === "product" || row.type === "customer" || row.type === "supplier")).map((row) => `${row.type}:${row.sourceId}`));
    const sql3 = getSql();
    const knownProducts = await db.select({ id: products.id, name: products.name, barcode: products.barcode, stockQuantity: products.stockQuantity }).from(products).where(eq7(products.shopId, input.shopId));
    const knownCustomers = await db.select({ id: customers.id, name: customers.name, phone: customers.phone }).from(customers).where(eq7(customers.shopId, input.shopId));
    const knownSuppliers = await db.select({ id: suppliers.id, name: suppliers.name, email: suppliers.email }).from(suppliers).where(eq7(suppliers.shopId, input.shopId));
    const queries = [];
    const customerByName = new Map(knownCustomers.map((row) => [normal(row.name), row.id]));
    const supplierByName = new Map(knownSuppliers.map((row) => [normal(row.name), row.id]));
    const productByName = new Map(knownProducts.map((row) => [normal(row.name), row.id]));
    const productByBarcode = new Map(knownProducts.filter((row) => Boolean(row.barcode)).map((row) => [row.barcode, row.id]));
    const finalStockByProduct = /* @__PURE__ */ new Map();
    const saleByReference = /* @__PURE__ */ new Map();
    const purchaseByReference = /* @__PURE__ */ new Map();
    let productCount = 0;
    let customerCount = 0;
    let supplierCount = 0;
    let saleCount = 0;
    let saleItemCount = 0;
    let purchaseCount = 0;
    let purchaseItemCount = 0;
    let expenseCount = 0;
    for (const item of input.data.products) {
      const clash = conflicts.find((row) => row.type === "product" && row.sourceId === item.sourceId);
      const matched = knownProducts.find((row) => item.barcode && row.barcode === item.barcode || normal(row.name) === normal(item.name));
      if (blocked.has(`product:${item.sourceId}`) || clash && input.conflictStrategy === "update" && !matched) continue;
      if (clash && input.conflictStrategy === "update" && matched) {
        queries.push(sql3`UPDATE products SET sale_price = ${item.salePrice}, purchase_price = ${item.purchasePrice}, category = ${item.category || "Sans cat\xE9gorie"}, unit = ${item.unit || "unit\xE9"}, alert_threshold = ${item.alertThreshold}, updated_at = now() WHERE id = ${matched.id}`);
        productByName.set(normal(item.name), matched.id);
        if (item.barcode) productByBarcode.set(item.barcode, matched.id);
        finalStockByProduct.set(matched.id, matched.stockQuantity);
        productCount++;
        continue;
      }
      const copy = Boolean(clash && input.conflictStrategy === "copy");
      const productId = crypto.randomUUID();
      const productName = copy ? `${item.name} (import ${item.sourceId})` : item.name;
      queries.push(sql3`INSERT INTO products (id, shop_id, name, barcode, reference, category, unit, sale_price, purchase_price, stock_quantity, alert_threshold) VALUES (${productId}, ${input.shopId}, ${productName}, ${copy ? null : item.barcode || null}, ${item.reference || null}, ${item.category || "Sans cat\xE9gorie"}, ${item.unit || "unit\xE9"}, ${item.salePrice}, ${item.purchasePrice}, ${item.stockQuantity}, ${item.alertThreshold})`);
      productByName.set(normal(item.name), productId);
      if (item.barcode) productByBarcode.set(item.barcode, productId);
      finalStockByProduct.set(productId, item.stockQuantity);
      productCount++;
    }
    for (const item of input.data.customers) {
      const clash = conflicts.find((row) => row.type === "customer" && row.sourceId === item.sourceId);
      const matched = knownCustomers.find((row) => item.phone && row.phone === item.phone || normal(row.name) === normal(item.name));
      if (blocked.has(`customer:${item.sourceId}`) || clash && input.conflictStrategy === "update" && !matched) continue;
      if (clash && input.conflictStrategy === "update" && matched) {
        queries.push(sql3`UPDATE customers SET phone = ${item.phone || matched.phone}, note = ${item.note || null}, updated_at = now() WHERE id = ${matched.id}`);
        customerByName.set(normal(item.name), matched.id);
        customerCount++;
        continue;
      }
      const copy = Boolean(clash && input.conflictStrategy === "copy");
      const customerId = crypto.randomUUID();
      const customerName = copy ? `${item.name} (import ${item.sourceId})` : item.name;
      queries.push(sql3`INSERT INTO customers (id, shop_id, name, phone, note) VALUES (${customerId}, ${input.shopId}, ${customerName}, ${copy ? null : item.phone || null}, ${item.note || null})`);
      customerByName.set(normal(item.name), customerId);
      customerCount++;
    }
    for (const item of input.data.suppliers) {
      const clash = conflicts.find((row) => row.type === "supplier" && row.sourceId === item.sourceId);
      const matched = knownSuppliers.find((row) => item.email && row.email === item.email || normal(row.name) === normal(item.name));
      if (blocked.has(`supplier:${item.sourceId}`) || clash && input.conflictStrategy === "update" && !matched) continue;
      if (clash && input.conflictStrategy === "update" && matched) {
        queries.push(sql3`UPDATE suppliers SET reference = ${item.reference || null}, contact_name = ${item.contactName || null}, phone = ${item.phone || null}, email = ${item.email || matched.email}, city = ${item.city || null}, delivery_lead_days = ${item.deliveryLeadDays || null}, payment_terms = ${item.paymentTerms || null}, updated_at = now() WHERE id = ${matched.id}`);
        supplierByName.set(normal(item.name), matched.id);
        supplierCount++;
        continue;
      }
      const copy = Boolean(clash && input.conflictStrategy === "copy");
      const supplierId = crypto.randomUUID();
      const supplierName = copy ? `${item.name} (import ${item.sourceId})` : item.name;
      queries.push(sql3`INSERT INTO suppliers (id, shop_id, name, reference, contact_name, phone, email, city, delivery_lead_days, payment_terms) VALUES (${supplierId}, ${input.shopId}, ${supplierName}, ${item.reference || null}, ${item.contactName || null}, ${item.phone || null}, ${copy ? null : item.email || null}, ${item.city || null}, ${item.deliveryLeadDays || null}, ${item.paymentTerms || null})`);
      supplierByName.set(normal(item.name), supplierId);
      supplierCount++;
    }
    for (const item of input.data.sales) {
      if (blocked.has(`sale:${item.sourceId}`)) continue;
      const customerId = item.customerName ? customerByName.get(normal(item.customerName)) : void 0;
      const amountPaid = Math.min(item.total, item.cash + item.mobileMoney);
      const creditAmount = Math.max(0, item.total - amountPaid);
      if (creditAmount > 0 && !customerId) continue;
      const saleId = crypto.randomUUID();
      const paymentMethod = creditAmount > 0 ? amountPaid > 0 ? "mixed" : "credit" : item.mobileMoney > 0 && item.cash > 0 ? "mixed" : item.mobileMoney > 0 ? "mobile_money" : "cash";
      const saleNumber = item.reference || `IMP-${fileHash.slice(0, 8).toUpperCase()}-${item.sourceId.slice(0, 24).toUpperCase()}`;
      queries.push(sql3`INSERT INTO sales (id, shop_id, customer_id, created_by, sale_number, operation_id, subtotal, discount_amount, total, amount_paid, credit_amount, payment_method, payment_breakdown, sold_at) VALUES (${saleId}, ${input.shopId}, ${customerId || null}, ${ctx.user.id}, ${saleNumber}, ${operation("sale", fileHash, item.sourceId)}, ${item.total + item.discountAmount}, ${item.discountAmount}, ${item.total}, ${amountPaid}, ${creditAmount}, ${paymentMethod}::payment_method, ${JSON.stringify({ cash: Math.min(item.cash, item.total), mobileMoney: Math.min(item.mobileMoney, Math.max(0, item.total - item.cash)) })}::jsonb, ${item.soldAt})`);
      if (creditAmount > 0 && customerId) queries.push(sql3`INSERT INTO receivables (shop_id, customer_id, sale_id, original_amount, balance, due_date) VALUES (${input.shopId}, ${customerId}, ${saleId}, ${creditAmount}, ${creditAmount}, ${item.dueDate || null})`);
      if (item.reference) saleByReference.set(item.reference, { id: saleId, soldAt: item.soldAt });
      saleCount++;
    }
    const plannedLines = input.data.saleItems.flatMap((item) => {
      const sale = saleByReference.get(item.saleReference);
      const productId = item.barcode ? productByBarcode.get(item.barcode) : productByName.get(normal(item.productName));
      if (!sale || !productId || !finalStockByProduct.has(productId) || blocked.has(`product:${item.sourceId}`)) return [];
      return [{ ...item, saleId: sale.id, soldAt: sale.soldAt, productId }];
    }).sort((left, right) => left.soldAt.valueOf() - right.soldAt.valueOf());
    const soldByProduct = /* @__PURE__ */ new Map();
    for (const item of plannedLines) soldByProduct.set(item.productId, (soldByProduct.get(item.productId) ?? 0) + item.quantity);
    const stockAfter = /* @__PURE__ */ new Map();
    for (const [productId, finalStock] of Array.from(finalStockByProduct.entries())) {
      const soldQuantity = soldByProduct.get(productId) ?? 0;
      const openingStock = finalStock + soldQuantity;
      const firstSaleAt = plannedLines.find((item) => item.productId === productId)?.soldAt;
      const openingAt = new Date((firstSaleAt?.valueOf() ?? Date.now()) - 1);
      stockAfter.set(productId, openingStock);
      queries.push(sql3`INSERT INTO stock_movements (shop_id, product_id, created_by, type, quantity_delta, stock_after, reason, created_at) VALUES (${input.shopId}, ${productId}, ${ctx.user.id}, 'opening'::stock_movement_type, ${openingStock}, ${openingStock}, ${soldQuantity > 0 ? "Solde d\u2019ouverture historique reconstitu\xE9" : "Stock initial import\xE9"}, ${openingAt})`);
    }
    for (const item of plannedLines) {
      const remaining = Math.max(0, (stockAfter.get(item.productId) ?? item.quantity) - item.quantity);
      stockAfter.set(item.productId, remaining);
      queries.push(sql3`INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, purchase_price, line_total) VALUES (${item.saleId}, ${item.productId}, ${item.productName}, ${item.quantity}, ${item.unitPrice}, ${item.purchasePrice}, ${item.quantity * item.unitPrice})`);
      queries.push(sql3`INSERT INTO stock_movements (shop_id, product_id, sale_id, created_by, type, quantity_delta, stock_after, reason, created_at) VALUES (${input.shopId}, ${item.productId}, ${item.saleId}, ${ctx.user.id}, 'sale'::stock_movement_type, ${-item.quantity}, ${remaining}, 'Vente historique importée', ${item.soldAt})`);
      saleItemCount++;
    }
    for (const item of input.data.purchases) {
      if (blocked.has(`purchase:${item.sourceId}`)) continue;
      const purchaseId = crypto.randomUUID();
      const supplierId = item.supplierName ? supplierByName.get(normal(item.supplierName)) : void 0;
      queries.push(sql3`INSERT INTO purchases (id, shop_id, supplier_id, created_by, purchase_number, operation_id, status, payment_method, subtotal, tax_amount, total, purchased_at, received_at) VALUES (${purchaseId}, ${input.shopId}, ${supplierId || null}, ${ctx.user.id}, ${item.reference}, ${operation("purchase", fileHash, item.sourceId)}, ${item.status}::purchase_status, ${item.paymentMethod || null}, ${item.subtotal}, ${item.taxAmount}, ${item.total}, ${item.purchasedAt}, ${item.status === "received" ? item.receivedAt || item.purchasedAt : null})`);
      purchaseByReference.set(item.reference, purchaseId);
      purchaseCount++;
    }
    for (const item of input.data.purchaseItems) {
      const purchaseId = purchaseByReference.get(item.purchaseReference);
      const productId = item.barcode ? productByBarcode.get(item.barcode) : productByName.get(normal(item.productName));
      if (!purchaseId || !productId || blocked.has(`product:${item.sourceId}`)) continue;
      queries.push(sql3`INSERT INTO purchase_items (purchase_id, product_id, product_name, quantity, unit_price, line_total) VALUES (${purchaseId}, ${productId}, ${item.productName}, ${item.quantity}, ${item.unitPrice}, ${item.quantity * item.unitPrice})`);
      purchaseItemCount++;
    }
    for (const item of input.data.expenses) {
      queries.push(sql3`INSERT INTO expenses (shop_id, created_by, operation_id, category, amount, note, spent_at) VALUES (${input.shopId}, ${ctx.user.id}, ${operation("expense", fileHash, item.sourceId)}, ${item.category}, ${item.amount}, ${item.note || null}, ${item.spentAt})`);
      expenseCount++;
    }
    const imported = { products: productCount, customers: customerCount, suppliers: supplierCount, sales: saleCount, saleItems: saleItemCount, purchases: purchaseCount, purchaseItems: purchaseItemCount, expenses: expenseCount };
    queries.unshift(sql3`INSERT INTO data_imports (shop_id, fingerprint, file_name, summary, imported_by) VALUES (${input.shopId}, ${fileHash}, ${input.fileName}, ${JSON.stringify(imported)}::jsonb, ${ctx.user.id})`);
    await sql3.transaction(queries);
    return { replayed: false, imported, skipped: conflicts.length, conflicts };
  })
});

// server/routers/currencies.ts
import { TRPCError as TRPCError7 } from "@trpc/server";
import { and as and7, desc as desc4, eq as eq8, lte as lte2 } from "drizzle-orm";
import { z as z7 } from "zod";
var supportedCurrencies = ["XAF", "XOF", "NGN", "GHS", "CDF", "KES", "USD", "EUR"];
var currencyCode = z7.string().trim().toUpperCase().refine((value) => supportedCurrencies.includes(value), "Devise non prise en charge.");
var shopInput = z7.object({ shopId: z7.string().uuid() });
async function getBaseCurrency(shopId) {
  const [shop] = await getDb().select({ currency: shops.currency }).from(shops).where(eq8(shops.id, shopId)).limit(1);
  if (!shop) throw new TRPCError7({ code: "NOT_FOUND", message: "Boutique introuvable." });
  return shop.currency;
}
var currenciesRouter = router({
  settings: protectedProcedure.input(shopInput).query(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId);
    const baseCurrency = await getBaseCurrency(input.shopId);
    const currencies = await getDb().select().from(shopCurrencies).where(eq8(shopCurrencies.shopId, input.shopId));
    return { baseCurrency, supportedCurrencies, currencies: [{ id: "base", shopId: input.shopId, currency: baseCurrency, label: "Devise de r\xE9f\xE9rence", isActive: true, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }, ...currencies.filter((entry) => entry.currency !== baseCurrency)] };
  }),
  rates: protectedProcedure.input(shopInput.extend({ currency: currencyCode.optional() })).query(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId);
    const conditions = [eq8(exchangeRates.shopId, input.shopId)];
    if (input.currency) conditions.push(eq8(exchangeRates.currency, input.currency));
    return getDb().select().from(exchangeRates).where(and7(...conditions)).orderBy(desc4(exchangeRates.effectiveAt)).limit(100);
  }),
  setCurrency: protectedProcedure.input(shopInput.extend({ currency: currencyCode, label: z7.string().trim().max(80).optional(), isActive: z7.boolean().default(true) })).mutation(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
    const baseCurrency = await getBaseCurrency(input.shopId);
    if (input.currency === baseCurrency && !input.isActive) throw new TRPCError7({ code: "BAD_REQUEST", message: "La devise de r\xE9f\xE9rence doit rester active." });
    const [currency] = await getDb().insert(shopCurrencies).values({ shopId: input.shopId, currency: input.currency, label: input.label || null, isActive: input.isActive }).onConflictDoUpdate({ target: [shopCurrencies.shopId, shopCurrencies.currency], set: { label: input.label || null, isActive: input.isActive, updatedAt: /* @__PURE__ */ new Date() } }).returning();
    return currency;
  }),
  setRate: protectedProcedure.input(shopInput.extend({ currency: currencyCode, rateToBase: z7.coerce.number().positive().max(1e9), effectiveAt: z7.coerce.date().optional(), note: z7.string().trim().max(240).optional() })).mutation(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
    const db = getDb();
    const baseCurrency = await getBaseCurrency(input.shopId);
    if (input.currency !== baseCurrency) {
      const [currency] = await db.select({ id: shopCurrencies.id, isActive: shopCurrencies.isActive }).from(shopCurrencies).where(and7(eq8(shopCurrencies.shopId, input.shopId), eq8(shopCurrencies.currency, input.currency))).limit(1);
      if (!currency?.isActive) throw new TRPCError7({ code: "BAD_REQUEST", message: "Activez cette devise avant de d\xE9finir son taux." });
    }
    const [rate] = await db.insert(exchangeRates).values({ shopId: input.shopId, currency: input.currency, rateToBase: input.currency === baseCurrency ? 1 : input.rateToBase, effectiveAt: input.effectiveAt ?? /* @__PURE__ */ new Date(), note: input.note || null, createdBy: ctx.user.id }).returning();
    return rate;
  }),
  quote: protectedProcedure.input(shopInput.extend({ currency: currencyCode, at: z7.coerce.date().optional() })).query(async ({ ctx, input }) => {
    await assertShopAccess(ctx.user.id, input.shopId);
    const baseCurrency = await getBaseCurrency(input.shopId);
    if (input.currency === baseCurrency) return { baseCurrency, currency: input.currency, rateToBase: 1, effectiveAt: input.at ?? /* @__PURE__ */ new Date() };
    const [currency] = await getDb().select({ isActive: shopCurrencies.isActive }).from(shopCurrencies).where(and7(eq8(shopCurrencies.shopId, input.shopId), eq8(shopCurrencies.currency, input.currency))).limit(1);
    if (!currency?.isActive) throw new TRPCError7({ code: "BAD_REQUEST", message: "Cette devise n\u2019est pas activ\xE9e pour la boutique." });
    const [rate] = await getDb().select().from(exchangeRates).where(and7(eq8(exchangeRates.shopId, input.shopId), eq8(exchangeRates.currency, input.currency), lte2(exchangeRates.effectiveAt, input.at ?? /* @__PURE__ */ new Date()))).orderBy(desc4(exchangeRates.effectiveAt)).limit(1);
    if (!rate) throw new TRPCError7({ code: "BAD_REQUEST", message: "D\xE9finissez un taux de conversion avant d\u2019encaisser dans cette devise." });
    return { baseCurrency, currency: input.currency, rateToBase: rate.rateToBase, effectiveAt: rate.effectiveAt, rateId: rate.id };
  })
});

// server/routers/admin.ts
import { TRPCError as TRPCError8 } from "@trpc/server";
import { and as and8, count, desc as desc5, eq as eq9, gte, ilike as ilike2, or, sql } from "drizzle-orm";
import { z as z8 } from "zod";
var listInput = z8.object({
  query: z8.string().trim().max(120).default(""),
  status: z8.enum(["all", "active", "suspended"]).default("all"),
  limit: z8.number().int().min(1).max(100).default(40)
});
var auditActions = [
  "initial_admin_claimed",
  "shop_suspended",
  "shop_reactivated",
  "user_suspended",
  "user_reactivated",
  "user_promoted_to_admin",
  "user_demoted_to_user"
];
var activityInput = z8.object({
  query: z8.string().trim().max(120).default(""),
  action: z8.enum(["all", ...auditActions]).default("all"),
  period: z8.enum(["all", "today", "week", "month"]).default("month"),
  limit: z8.number().int().min(1).max(100).default(40)
});
async function writeAuditLog(actorId, action, targetType, targetId, metadata = {}) {
  await getDb().insert(adminAuditLogs).values({
    actorId,
    action,
    targetType,
    targetId,
    metadata
  });
}
async function getActiveAdminCount() {
  const [result] = await getDb().select({ value: sql`count(*)` }).from(users).where(and8(eq9(users.role, "admin"), eq9(users.isActive, true)));
  return Number(result?.value ?? 0);
}
function isPlatformOwner(email) {
  const ownerEmail = ENV.platformOwnerEmail.trim().toLowerCase();
  return Boolean(ownerEmail) && email?.trim().toLowerCase() === ownerEmail;
}
var adminRouter = router({
  bootstrapStatus: protectedProcedure.query(async ({ ctx }) => {
    const [result] = await getDb().select({ value: sql`count(*)` }).from(users).where(eq9(users.role, "admin"));
    const available = Number(result?.value ?? 0) === 0;
    return {
      available,
      canClaimInitialAccess: available && isPlatformOwner(ctx.user.email)
    };
  }),
  /**
   * Seul le compte propriétaire configuré peut initialiser l’administration
   * une fois. Les accès ultérieurs sont contrôlés par adminProcedure.
   */
  claimInitialAccess: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role === "admin") return { role: "admin" };
    if (!isPlatformOwner(ctx.user.email)) {
      throw new TRPCError8({
        code: "FORBIDDEN",
        message: "Seul le compte propri\xE9taire de la plateforme peut initialiser l\u2019administration SaaS."
      });
    }
    const [existingAdmin] = await getDb().select({ id: users.id }).from(users).where(eq9(users.role, "admin")).limit(1);
    if (existingAdmin) {
      throw new TRPCError8({
        code: "FORBIDDEN",
        message: "L\u2019administration SaaS est d\xE9j\xE0 configur\xE9e."
      });
    }
    const claimed = await getDb().update(users).set({ role: "admin", updatedAt: /* @__PURE__ */ new Date() }).where(
      and8(
        eq9(users.id, ctx.user.id),
        sql`NOT EXISTS (SELECT 1 FROM "users" AS "existing_admin" WHERE "existing_admin"."role" = 'admin')`
      )
    ).returning({ id: users.id });
    if (!claimed[0]) {
      throw new TRPCError8({
        code: "CONFLICT",
        message: "L\u2019administration SaaS vient d\u2019\xEAtre configur\xE9e par un autre compte."
      });
    }
    await writeAuditLog(
      ctx.user.id,
      "initial_admin_claimed",
      "user",
      ctx.user.id
    );
    return { role: "admin" };
  }),
  overview: adminProcedure.query(async () => {
    const db = getDb();
    const [[userStats], [shopStats], [salesStats], [auditStats], [supportStats]] = await Promise.all([
      db.select({
        total: sql`count(*)`,
        active: sql`count(*) filter (where ${users.isActive})`,
        administrators: sql`count(*) filter (where ${users.role} = 'admin')`,
        newLast7Days: sql`count(*) filter (where ${users.createdAt} >= now() - interval '7 days')`
      }).from(users),
      db.select({
        total: sql`count(*)`,
        active: sql`count(*) filter (where ${shops.isActive})`,
        suspended: sql`count(*) filter (where not ${shops.isActive})`,
        newLast7Days: sql`count(*) filter (where ${shops.createdAt} >= now() - interval '7 days')`
      }).from(shops),
      db.select({
        total: sql`count(*)`,
        today: sql`count(*) filter (where ${sales.soldAt} >= current_date)`,
        turnover: sql`coalesce(sum(${sales.total}), 0)`,
        turnoverToday: sql`coalesce(sum(${sales.total}) filter (where ${sales.soldAt} >= current_date), 0)`
      }).from(sales),
      db.select({
        value: sql`count(*) filter (where ${adminAuditLogs.createdAt} >= current_date)`
      }).from(adminAuditLogs),
      db.select({
        pending: sql`count(*) filter (where ${supportTickets.status} in ('open', 'in_progress'))`,
        waitingUser: sql`count(*) filter (where ${supportTickets.status} = 'waiting_user')`,
        highPriority: sql`count(*) filter (where ${supportTickets.priority} = 'high' and ${supportTickets.status} in ('open', 'in_progress'))`
      }).from(supportTickets)
    ]);
    return {
      users: {
        total: Number(userStats?.total ?? 0),
        active: Number(userStats?.active ?? 0),
        administrators: Number(userStats?.administrators ?? 0),
        newLast7Days: Number(userStats?.newLast7Days ?? 0)
      },
      shops: {
        total: Number(shopStats?.total ?? 0),
        active: Number(shopStats?.active ?? 0),
        suspended: Number(shopStats?.suspended ?? 0),
        newLast7Days: Number(shopStats?.newLast7Days ?? 0)
      },
      sales: {
        total: Number(salesStats?.total ?? 0),
        today: Number(salesStats?.today ?? 0),
        turnover: Number(salesStats?.turnover ?? 0),
        turnoverToday: Number(salesStats?.turnoverToday ?? 0)
      },
      activityToday: Number(auditStats?.value ?? 0),
      support: {
        pending: Number(supportStats?.pending ?? 0),
        waitingUser: Number(supportStats?.waitingUser ?? 0),
        highPriority: Number(supportStats?.highPriority ?? 0)
      }
    };
  }),
  shops: adminProcedure.input(listInput).query(async ({ input }) => {
    const search = input.query ? `%${input.query}%` : void 0;
    const statusCondition = input.status === "active" ? eq9(shops.isActive, true) : input.status === "suspended" ? eq9(shops.isActive, false) : void 0;
    const searchCondition = search ? or(ilike2(shops.name, search), ilike2(shops.slug, search)) : void 0;
    return getDb().select({
      id: shops.id,
      name: shops.name,
      slug: shops.slug,
      currency: shops.currency,
      country: shops.country,
      isActive: shops.isActive,
      suspensionReason: shops.suspensionReason,
      suspendedAt: shops.suspendedAt,
      createdAt: shops.createdAt,
      ownerId: users.id,
      ownerName: users.name,
      ownerEmail: users.email
    }).from(shops).innerJoin(users, eq9(shops.createdBy, users.id)).where(and8(statusCondition, searchCondition)).orderBy(desc5(shops.createdAt)).limit(input.limit);
  }),
  users: adminProcedure.input(listInput).query(async ({ input }) => {
    const search = input.query ? `%${input.query}%` : void 0;
    const statusCondition = input.status === "active" ? eq9(users.isActive, true) : input.status === "suspended" ? eq9(users.isActive, false) : void 0;
    const searchCondition = search ? or(ilike2(users.name, search), ilike2(users.email, search)) : void 0;
    const rows = await getDb().select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn
    }).from(users).where(and8(statusCondition, searchCondition)).orderBy(desc5(users.createdAt)).limit(input.limit);
    const memberships = await getDb().select({ userId: shopMembers.userId, value: count() }).from(shopMembers).groupBy(shopMembers.userId);
    const shopCountByUser = new Map(
      memberships.map((item) => [item.userId, Number(item.value)])
    );
    return rows.map((user) => ({
      ...user,
      shopCount: shopCountByUser.get(user.id) ?? 0
    }));
  }),
  activity: adminProcedure.input(activityInput).query(async ({ input }) => {
    const search = input.query ? `%${input.query}%` : void 0;
    const now = /* @__PURE__ */ new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const cutoff = input.period === "today" ? startOfToday : input.period === "week" ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3) : input.period === "month" ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3) : void 0;
    const actionCondition = input.action === "all" ? void 0 : eq9(adminAuditLogs.action, input.action);
    const searchCondition = search ? or(
      ilike2(users.name, search),
      ilike2(users.email, search),
      ilike2(adminAuditLogs.targetType, search),
      ilike2(adminAuditLogs.action, search)
    ) : void 0;
    return getDb().select({
      id: adminAuditLogs.id,
      action: adminAuditLogs.action,
      targetType: adminAuditLogs.targetType,
      targetId: adminAuditLogs.targetId,
      metadata: adminAuditLogs.metadata,
      createdAt: adminAuditLogs.createdAt,
      actorName: users.name,
      actorEmail: users.email
    }).from(adminAuditLogs).innerJoin(users, eq9(adminAuditLogs.actorId, users.id)).where(
      and8(
        actionCondition,
        searchCondition,
        cutoff ? gte(adminAuditLogs.createdAt, cutoff) : void 0
      )
    ).orderBy(desc5(adminAuditLogs.createdAt)).limit(input.limit);
  }),
  setShopActive: adminProcedure.input(
    z8.object({
      shopId: z8.string().uuid(),
      isActive: z8.boolean(),
      reason: z8.string().trim().min(3).max(240).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!input.isActive && !input.reason) {
      throw new TRPCError8({
        code: "BAD_REQUEST",
        message: "Un motif est requis pour suspendre une boutique."
      });
    }
    const [target] = await getDb().select({ id: shops.id, name: shops.name, isActive: shops.isActive }).from(shops).where(eq9(shops.id, input.shopId)).limit(1);
    if (!target) {
      throw new TRPCError8({
        code: "NOT_FOUND",
        message: "Boutique introuvable."
      });
    }
    const now = /* @__PURE__ */ new Date();
    await getDb().update(shops).set({
      isActive: input.isActive,
      suspendedAt: input.isActive ? null : now,
      suspensionReason: input.isActive ? null : input.reason,
      suspendedBy: input.isActive ? null : ctx.user.id,
      updatedAt: now
    }).where(eq9(shops.id, input.shopId));
    await writeAuditLog(
      ctx.user.id,
      input.isActive ? "shop_reactivated" : "shop_suspended",
      "shop",
      target.id,
      { name: target.name, reason: input.reason ?? null }
    );
    return { id: target.id, isActive: input.isActive };
  }),
  setUserActive: adminProcedure.input(z8.object({ userId: z8.string().uuid(), isActive: z8.boolean() })).mutation(async ({ ctx, input }) => {
    if (input.userId === ctx.user.id) {
      throw new TRPCError8({
        code: "BAD_REQUEST",
        message: "Vous ne pouvez pas d\xE9sactiver votre propre compte administrateur."
      });
    }
    const [target] = await getDb().select({ id: users.id, role: users.role, isActive: users.isActive }).from(users).where(eq9(users.id, input.userId)).limit(1);
    if (!target) {
      throw new TRPCError8({
        code: "NOT_FOUND",
        message: "Compte introuvable."
      });
    }
    if (!input.isActive && target.role === "admin" && target.isActive && await getActiveAdminCount() <= 1) {
      throw new TRPCError8({
        code: "CONFLICT",
        message: "Au moins un administrateur actif doit rester disponible."
      });
    }
    await getDb().update(users).set({ isActive: input.isActive, updatedAt: /* @__PURE__ */ new Date() }).where(eq9(users.id, input.userId));
    await writeAuditLog(
      ctx.user.id,
      input.isActive ? "user_reactivated" : "user_suspended",
      "user",
      target.id
    );
    return { id: target.id, isActive: input.isActive };
  }),
  setUserRole: adminProcedure.input(
    z8.object({ userId: z8.string().uuid(), role: z8.enum(["admin", "user"]) })
  ).mutation(async ({ ctx, input }) => {
    if (input.userId === ctx.user.id) {
      throw new TRPCError8({
        code: "BAD_REQUEST",
        message: "Un administrateur ne peut pas modifier son propre r\xF4le."
      });
    }
    const [target] = await getDb().select({ id: users.id, role: users.role, isActive: users.isActive }).from(users).where(eq9(users.id, input.userId)).limit(1);
    if (!target) {
      throw new TRPCError8({
        code: "NOT_FOUND",
        message: "Compte introuvable."
      });
    }
    if (target.role === "admin" && input.role === "user" && target.isActive && await getActiveAdminCount() <= 1) {
      throw new TRPCError8({
        code: "CONFLICT",
        message: "Au moins un administrateur actif doit rester disponible."
      });
    }
    await getDb().update(users).set({ role: input.role, updatedAt: /* @__PURE__ */ new Date() }).where(eq9(users.id, input.userId));
    await writeAuditLog(
      ctx.user.id,
      input.role === "admin" ? "user_promoted_to_admin" : "user_demoted_to_user",
      "user",
      target.id
    );
    return { id: target.id, role: input.role };
  })
});

// server/routers/support.ts
import { TRPCError as TRPCError9 } from "@trpc/server";
import { and as and9, desc as desc6, eq as eq10, ilike as ilike3, or as or2, sql as sql2 } from "drizzle-orm";
import { z as z9 } from "zod";
var ticketStatus = z9.enum([
  "open",
  "in_progress",
  "waiting_user",
  "resolved",
  "closed"
]);
var ticketCategory = z9.enum([
  "account",
  "technical",
  "data",
  "payment",
  "feature",
  "other"
]);
var ticketPriority = z9.enum(["low", "medium", "high"]);
var messageInput = z9.object({
  ticketId: z9.string().uuid(),
  body: z9.string().trim().min(2).max(5e3)
});
function makeTicketNumber() {
  return `SUP-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}
async function getUserTicket(ticketId, userId) {
  const [ticket] = await getDb().select({
    id: supportTickets.id,
    ticketNumber: supportTickets.ticketNumber,
    priority: supportTickets.priority,
    status: supportTickets.status,
    userId: supportTickets.userId
  }).from(supportTickets).where(
    and9(eq10(supportTickets.id, ticketId), eq10(supportTickets.userId, userId))
  ).limit(1);
  if (!ticket) {
    throw new TRPCError9({
      code: "NOT_FOUND",
      message: "Demande de support introuvable."
    });
  }
  return ticket;
}
async function getAnyTicket(ticketId) {
  const [ticket] = await getDb().select({
    id: supportTickets.id,
    ticketNumber: supportTickets.ticketNumber,
    priority: supportTickets.priority,
    status: supportTickets.status,
    userId: supportTickets.userId
  }).from(supportTickets).where(eq10(supportTickets.id, ticketId)).limit(1);
  if (!ticket) {
    throw new TRPCError9({
      code: "NOT_FOUND",
      message: "Demande de support introuvable."
    });
  }
  return ticket;
}
async function listMessages(ticketId) {
  return getDb().select({
    id: supportMessages.id,
    body: supportMessages.body,
    authorType: supportMessages.authorType,
    createdAt: supportMessages.createdAt,
    authorName: users.name,
    authorEmail: users.email
  }).from(supportMessages).innerJoin(users, eq10(supportMessages.authorId, users.id)).where(eq10(supportMessages.ticketId, ticketId)).orderBy(supportMessages.createdAt);
}
var adminListInput = z9.object({
  query: z9.string().trim().max(160).default(""),
  status: z9.union([ticketStatus, z9.literal("all")]).default("all"),
  priority: z9.union([ticketPriority, z9.literal("all")]).default("all"),
  limit: z9.number().int().min(1).max(100).default(50)
});
var supportRouter = router({
  create: protectedProcedure.input(
    z9.object({
      shopId: z9.string().uuid().optional(),
      category: ticketCategory,
      priority: ticketPriority.default("medium"),
      subject: z9.string().trim().min(3).max(180),
      message: z9.string().trim().min(5).max(5e3)
    })
  ).mutation(async ({ ctx, input }) => {
    if (input.shopId && !await getMembership(ctx.user.id, input.shopId)) {
      throw new TRPCError9({
        code: "FORBIDDEN",
        message: "Vous ne pouvez pas associer cette boutique \xE0 votre demande."
      });
    }
    const ticketId = crypto.randomUUID();
    const ticketNumber = makeTicketNumber();
    const now = /* @__PURE__ */ new Date();
    await getDb().insert(supportTickets).values({
      id: ticketId,
      ticketNumber,
      userId: ctx.user.id,
      shopId: input.shopId,
      category: input.category,
      priority: input.priority,
      subject: input.subject,
      lastMessageAt: now,
      lastMessageBy: "user"
    });
    await getDb().insert(supportMessages).values({
      ticketId,
      authorId: ctx.user.id,
      authorType: "user",
      body: input.message
    });
    return { id: ticketId, ticketNumber };
  }),
  mine: protectedProcedure.input(
    z9.object({
      status: z9.union([ticketStatus, z9.literal("all")]).default("all")
    })
  ).query(async ({ ctx, input }) => {
    const statusCondition = input.status === "all" ? void 0 : eq10(supportTickets.status, input.status);
    return getDb().select({
      id: supportTickets.id,
      ticketNumber: supportTickets.ticketNumber,
      category: supportTickets.category,
      priority: supportTickets.priority,
      subject: supportTickets.subject,
      status: supportTickets.status,
      lastMessageAt: supportTickets.lastMessageAt,
      lastMessageBy: supportTickets.lastMessageBy,
      closedAt: supportTickets.closedAt,
      shopName: shops.name
    }).from(supportTickets).leftJoin(shops, eq10(supportTickets.shopId, shops.id)).where(and9(eq10(supportTickets.userId, ctx.user.id), statusCondition)).orderBy(desc6(supportTickets.lastMessageAt));
  }),
  detail: protectedProcedure.input(z9.object({ ticketId: z9.string().uuid() })).query(async ({ ctx, input }) => {
    const ticket = await getUserTicket(input.ticketId, ctx.user.id);
    return { ticket, messages: await listMessages(input.ticketId) };
  }),
  reply: protectedProcedure.input(messageInput).mutation(async ({ ctx, input }) => {
    const ticket = await getUserTicket(input.ticketId, ctx.user.id);
    if (ticket.status === "closed") {
      throw new TRPCError9({
        code: "CONFLICT",
        message: "Cette demande est cl\xF4tur\xE9e. Cr\xE9ez une nouvelle demande si le probl\xE8me persiste."
      });
    }
    const now = /* @__PURE__ */ new Date();
    await getDb().insert(supportMessages).values({
      ticketId: ticket.id,
      authorId: ctx.user.id,
      authorType: "user",
      body: input.body
    });
    await getDb().update(supportTickets).set({
      status: "open",
      closedAt: null,
      lastMessageAt: now,
      lastMessageBy: "user",
      updatedAt: now
    }).where(eq10(supportTickets.id, ticket.id));
    return { id: ticket.id, status: "open" };
  }),
  close: protectedProcedure.input(z9.object({ ticketId: z9.string().uuid() })).mutation(async ({ ctx, input }) => {
    const ticket = await getUserTicket(input.ticketId, ctx.user.id);
    const now = /* @__PURE__ */ new Date();
    await getDb().update(supportTickets).set({ status: "closed", closedAt: now, updatedAt: now }).where(eq10(supportTickets.id, ticket.id));
    return { id: ticket.id, status: "closed" };
  }),
  adminSummary: adminProcedure.query(async () => {
    const [result] = await getDb().select({
      open: sql2`count(*) filter (where ${supportTickets.status} = 'open')`,
      inProgress: sql2`count(*) filter (where ${supportTickets.status} = 'in_progress')`,
      waitingUser: sql2`count(*) filter (where ${supportTickets.status} = 'waiting_user')`,
      resolved: sql2`count(*) filter (where ${supportTickets.status} = 'resolved')`,
      pending: sql2`count(*) filter (where ${supportTickets.status} in ('open', 'in_progress'))`
    }).from(supportTickets);
    return {
      open: Number(result?.open ?? 0),
      inProgress: Number(result?.inProgress ?? 0),
      waitingUser: Number(result?.waitingUser ?? 0),
      resolved: Number(result?.resolved ?? 0),
      pending: Number(result?.pending ?? 0)
    };
  }),
  adminList: adminProcedure.input(adminListInput).query(async ({ input }) => {
    const search = input.query ? `%${input.query}%` : void 0;
    const statusCondition = input.status === "all" ? void 0 : eq10(supportTickets.status, input.status);
    const priorityCondition = input.priority === "all" ? void 0 : eq10(supportTickets.priority, input.priority);
    const searchCondition = search ? or2(
      ilike3(supportTickets.ticketNumber, search),
      ilike3(supportTickets.subject, search),
      ilike3(users.email, search),
      ilike3(users.name, search)
    ) : void 0;
    return getDb().select({
      id: supportTickets.id,
      ticketNumber: supportTickets.ticketNumber,
      category: supportTickets.category,
      priority: supportTickets.priority,
      subject: supportTickets.subject,
      status: supportTickets.status,
      assignedAdminId: supportTickets.assignedAdminId,
      lastMessageAt: supportTickets.lastMessageAt,
      lastMessageBy: supportTickets.lastMessageBy,
      createdAt: supportTickets.createdAt,
      requesterName: users.name,
      requesterEmail: users.email,
      shopName: shops.name
    }).from(supportTickets).innerJoin(users, eq10(supportTickets.userId, users.id)).leftJoin(shops, eq10(supportTickets.shopId, shops.id)).where(and9(statusCondition, priorityCondition, searchCondition)).orderBy(
      sql2`case ${supportTickets.priority} when 'high' then 3 when 'medium' then 2 else 1 end desc`,
      desc6(supportTickets.lastMessageAt)
    ).limit(input.limit);
  }),
  adminDetail: adminProcedure.input(z9.object({ ticketId: z9.string().uuid() })).query(async ({ input }) => {
    const ticket = await getAnyTicket(input.ticketId);
    return { ticket, messages: await listMessages(input.ticketId) };
  }),
  adminReply: adminProcedure.input(messageInput).mutation(async ({ ctx, input }) => {
    const ticket = await getAnyTicket(input.ticketId);
    if (ticket.status === "closed") {
      throw new TRPCError9({
        code: "CONFLICT",
        message: "Cette demande est d\xE9j\xE0 cl\xF4tur\xE9e."
      });
    }
    const now = /* @__PURE__ */ new Date();
    await getDb().insert(supportMessages).values({
      ticketId: ticket.id,
      authorId: ctx.user.id,
      authorType: "admin",
      body: input.body
    });
    await getDb().update(supportTickets).set({
      status: "waiting_user",
      assignedAdminId: ctx.user.id,
      lastMessageAt: now,
      lastMessageBy: "admin",
      updatedAt: now
    }).where(eq10(supportTickets.id, ticket.id));
    return { id: ticket.id, status: "waiting_user" };
  }),
  adminSetStatus: adminProcedure.input(z9.object({ ticketId: z9.string().uuid(), status: ticketStatus })).mutation(async ({ ctx, input }) => {
    const ticket = await getAnyTicket(input.ticketId);
    const now = /* @__PURE__ */ new Date();
    await getDb().update(supportTickets).set({
      status: input.status,
      assignedAdminId: ctx.user.id,
      closedAt: input.status === "closed" ? now : null,
      updatedAt: now
    }).where(eq10(supportTickets.id, ticket.id));
    return { id: ticket.id, status: input.status };
  }),
  adminSetPriority: adminProcedure.input(z9.object({ ticketId: z9.string().uuid(), priority: ticketPriority })).mutation(async ({ ctx, input }) => {
    const ticket = await getAnyTicket(input.ticketId);
    const now = /* @__PURE__ */ new Date();
    await getDb().update(supportTickets).set({
      priority: input.priority,
      assignedAdminId: ctx.user.id,
      updatedAt: now
    }).where(eq10(supportTickets.id, ticket.id));
    return { id: ticket.id, priority: input.priority };
  })
});

// server/routers.ts
var appRouter = router({
  auth: authRouter,
  catalog: catalogRouter,
  commerce: commerceRouter,
  closing: closingRouter,
  insights: insightsRouter,
  migration: migrationRouter,
  currencies: currenciesRouter,
  admin: adminRouter,
  support: supportRouter,
  shops: router({
    list: protectedProcedure.query(({ ctx }) => listUserShops(ctx.user.id)),
    create: protectedProcedure.input(z10.object({ name: z10.string().trim().min(2).max(180), currency: z10.enum(["XAF", "XOF", "NGN"]).default("XAF"), country: z10.string().trim().length(3).default("CMR") })).mutation(async ({ ctx, input }) => {
      const shopId = crypto.randomUUID();
      const sql3 = getSql();
      await sql3.transaction([
        sql3`INSERT INTO shops (id, name, slug, currency, country, created_by) VALUES (${shopId}, ${input.name}, ${makeShopSlug(input.name)}, ${input.currency}, ${input.country.toUpperCase()}, ${ctx.user.id})`,
        sql3`INSERT INTO shop_members (shop_id, user_id, role) VALUES (${shopId}, ${ctx.user.id}, 'owner')`,
        sql3`INSERT INTO shop_currencies (shop_id, currency, label, is_active) VALUES (${shopId}, ${input.currency}, 'Devise de référence', true)`
      ]);
      return (await getDb().select().from(shops).where(eq11(shops.id, shopId)).limit(1))[0];
    }),
    memberRole: protectedProcedure.input(z10.object({ shopId: z10.string().uuid() })).query(({ ctx, input }) => assertShopAccess(ctx.user.id, input.shopId)),
    members: protectedProcedure.input(z10.object({ shopId: z10.string().uuid() })).query(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner", "manager"]);
      return getDb().select({ id: users.id, name: users.name, email: users.email, role: shopMembers.role }).from(shopMembers).innerJoin(users, eq11(shopMembers.userId, users.id)).where(eq11(shopMembers.shopId, input.shopId));
    }),
    addMember: protectedProcedure.input(z10.object({ shopId: z10.string().uuid(), email: z10.string().email(), role: z10.enum(["manager", "seller"]) })).mutation(async ({ ctx, input }) => {
      await assertShopAccess(ctx.user.id, input.shopId, ["owner"]);
      const member = await getUserByEmail(input.email);
      if (!member) throw new Error("Ce collaborateur doit cr\xE9er son compte EASYSTOR avant d\u2019\xEAtre ajout\xE9.");
      await getDb().insert(shopMembers).values({ shopId: input.shopId, userId: member.id, role: input.role }).onConflictDoUpdate({ target: [shopMembers.shopId, shopMembers.userId], set: { role: input.role } });
      return { id: member.id, email: member.email, role: input.role };
    })
  })
});

// server/neonAuth.ts
import { createRemoteJWKSet, jwtVerify as jwtVerify2 } from "jose";
import { eq as eq12 } from "drizzle-orm";
function neonAuthBaseUrl() {
  const value = process.env.NEON_AUTH_BASE_URL?.trim();
  if (!value) throw new Error("NEON_AUTH_BASE_URL is required");
  return value.replace(/\/$/, "");
}
var jwks = null;
function neonJwks() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(`${neonAuthBaseUrl()}/.well-known/jwks.json`));
  return jwks;
}
function bearerToken(req) {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;
}
function isVerifiedNeonIdentity(claims) {
  return Boolean(claims.sub && claims.email?.trim() && claims.emailVerified === true);
}
async function getNeonAuthenticatedUser(req) {
  const token = bearerToken(req);
  if (!token) return null;
  try {
    const baseUrl = neonAuthBaseUrl();
    const origin = new URL(baseUrl).origin;
    const { payload: payload2 } = await jwtVerify2(token, neonJwks(), {
      issuer: origin,
      audience: origin
    });
    return resolveNeonIdentity(payload2);
  } catch {
    return null;
  }
}
async function resolveNeonIdentity(claims) {
  const externalUserId = claims.sub;
  const email = claims.email?.trim().toLowerCase();
  if (!isVerifiedNeonIdentity(claims) || !externalUserId || !email) return null;
  const db = getDb();
  const [identity] = await db.select().from(neonAuthIdentities).where(eq12(neonAuthIdentities.externalUserId, externalUserId)).limit(1);
  if (identity) {
    await db.update(neonAuthIdentities).set({ lastSeenAt: /* @__PURE__ */ new Date() }).where(eq12(neonAuthIdentities.externalUserId, externalUserId));
    const user2 = await getUserById(identity.userId);
    return user2?.isActive ? user2 : null;
  }
  let user = await getUserByEmail(email);
  if (!user) {
    const id = crypto.randomUUID();
    await db.insert(users).values({
      id,
      name: claims.name?.trim().slice(0, 160) || email.split("@")[0],
      email,
      loginMethod: "neon_auth"
    }).onConflictDoNothing({ target: users.email });
    user = await getUserByEmail(email);
  }
  if (!user?.isActive) return null;
  await db.insert(neonAuthIdentities).values({ externalUserId, userId: user.id, email }).onConflictDoNothing({ target: neonAuthIdentities.externalUserId });
  await db.update(users).set({ lastSignedIn: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq12(users.id, user.id));
  return user;
}

// server/_core/context.ts
async function createContext(opts) {
  const neonUser = await getNeonAuthenticatedUser(opts.req);
  if (neonUser) return { req: opts.req, res: opts.res, user: neonUser };
  const user = await getAuthenticatedUser(opts.req);
  return { req: opts.req, res: opts.res, user };
}

// server/_core/proxyTrust.ts
function trustedProxySetting(environment = process.env.NODE_ENV) {
  return environment === "production" ? 1 : false;
}
function configureTrustedProxy(app) {
  app.set("trust proxy", trustedProxySetting());
}

// server/_core/securityHeaders.ts
var NEON_AUTH_ORIGIN = "https://ep-blue-truth-ajqoem9y.neonauth.c-3.us-east-2.aws.neon.tech";
var SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), geolocation=(), microphone=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Content-Security-Policy": `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' ${NEON_AUTH_ORIGIN}; manifest-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`
};
function applySecurityHeaders(res) {
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(header, value);
  }
}
function securityHeadersMiddleware(_req, res, next) {
  applySecurityHeaders(res);
  next();
}

// server/vercel/trpcHandler.ts
var api = express();
configureTrustedProxy(api);
api.use(securityHeadersMiddleware);
api.use(express.json({ limit: API_BODY_LIMIT }));
api.use(express.urlencoded({ extended: true, limit: API_BODY_LIMIT }));
api.use((req, _res, next) => {
  req.url = req.url.replace(/^\/api\/trpc/, "") || "/";
  next();
});
api.use(createExpressMiddleware({ router: appRouter, createContext }));
var trpcHandler_default = api;
export {
  trpcHandler_default as default
};
