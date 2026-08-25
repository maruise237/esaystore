import {
  boolean,
  date,
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
  varchar,
} from "drizzle-orm/pg-core";

const money = (name: string) =>
  numeric(name, { precision: 14, scale: 2, mode: "number" });
const quantity = (name: string) =>
  numeric(name, { precision: 14, scale: 3, mode: "number" });

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const shopRoleEnum = pgEnum("shop_role", ["owner", "manager", "seller"]);
export const movementTypeEnum = pgEnum("stock_movement_type", [
  "opening",
  "restock",
  "adjustment",
  "sale",
  "return",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "mobile_money",
  "credit",
  "mixed",
]);
export const saleStatusEnum = pgEnum("sale_status", ["completed", "cancelled"]);
export const syncKindEnum = pgEnum("sync_kind", [
  "sale",
  "expense",
  "repayment",
  "adjustment",
]);
export const supportTicketStatusEnum = pgEnum("support_ticket_status", [
  "open",
  "in_progress",
  "waiting_user",
  "resolved",
  "closed",
]);
export const supportTicketCategoryEnum = pgEnum("support_ticket_category", [
  "account",
  "technical",
  "data",
  "payment",
  "feature",
  "other",
]);
export const supportAuthorTypeEnum = pgEnum("support_author_type", [
  "user",
  "admin",
]);
export const supportTicketPriorityEnum = pgEnum("support_ticket_priority", [
  "low",
  "medium",
  "high",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  openId: varchar("open_id", { length: 128 }).unique(),
  email: varchar("email", { length: 320 }).unique(),
  name: varchar("name", { length: 160 }),
  passwordHash: text("password_hash"),
  loginMethod: varchar("login_method", { length: 64 })
    .default("password")
    .notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const shops = pgTable("shops", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  currency: varchar("currency", { length: 8 }).default("XAF").notNull(),
  country: varchar("country", { length: 3 }).default("CMR").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  suspensionReason: varchar("suspension_reason", { length: 240 }),
  suspendedBy: uuid("suspended_by").references(() => users.id, {
    onDelete: "restrict",
  }),
  createdBy: uuid("created_by")
    .references(() => users.id, { onDelete: "restrict" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    action: varchar("action", { length: 80 }).notNull(),
    targetType: varchar("target_type", { length: 40 }).notNull(),
    targetId: varchar("target_id", { length: 128 }),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    index("admin_audit_logs_created_idx").on(table.createdAt),
    index("admin_audit_logs_actor_created_idx").on(
      table.actorId,
      table.createdAt
    ),
    index("admin_audit_logs_target_idx").on(table.targetType, table.targetId),
  ]
);

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketNumber: varchar("ticket_number", { length: 40 }).notNull().unique(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    shopId: uuid("shop_id").references(() => shops.id, {
      onDelete: "set null",
    }),
    category: supportTicketCategoryEnum("category").notNull(),
    subject: varchar("subject", { length: 180 }).notNull(),
    priority: supportTicketPriorityEnum("priority").default("medium").notNull(),
    status: supportTicketStatusEnum("status").default("open").notNull(),
    assignedAdminId: uuid("assigned_admin_id").references(() => users.id, {
      onDelete: "set null",
    }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastMessageBy: supportAuthorTypeEnum("last_message_by")
      .default("user")
      .notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
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
    index("support_tickets_assigned_admin_idx").on(table.assignedAdminId),
  ]
);

export const supportMessages = pgTable(
  "support_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketId: uuid("ticket_id")
      .references(() => supportTickets.id, { onDelete: "cascade" })
      .notNull(),
    authorId: uuid("author_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    authorType: supportAuthorTypeEnum("author_type").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    index("support_messages_ticket_created_idx").on(
      table.ticketId,
      table.createdAt
    ),
  ]
);

export const shopMembers = pgTable(
  "shop_members",
  {
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: shopRoleEnum("role").default("seller").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    primaryKey({ columns: [table.shopId, table.userId] }),
    index("shop_members_user_idx").on(table.userId),
  ]
);

export const shopCurrencies = pgTable(
  "shop_currencies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    currency: varchar("currency", { length: 8 }).notNull(),
    label: varchar("label", { length: 80 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    uniqueIndex("shop_currencies_shop_currency_unique").on(
      table.shopId,
      table.currency
    ),
  ]
);

export const exchangeRates = pgTable(
  "exchange_rates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    currency: varchar("currency", { length: 8 }).notNull(),
    rateToBase: numeric("rate_to_base", {
      precision: 20,
      scale: 8,
      mode: "number",
    }).notNull(),
    effectiveAt: timestamp("effective_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    note: varchar("note", { length: 240 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    index("exchange_rates_shop_currency_date_idx").on(
      table.shopId,
      table.currency,
      table.effectiveAt
    ),
  ]
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 240 }).notNull(),
    reference: varchar("reference", { length: 120 }),
    barcode: varchar("barcode", { length: 120 }),
    category: varchar("category", { length: 120 })
      .default("Sans catégorie")
      .notNull(),
    unit: varchar("unit", { length: 24 }).default("unité").notNull(),
    purchasePrice: money("purchase_price").default(0).notNull(),
    salePrice: money("sale_price").default(0).notNull(),
    wholesalePrice: money("wholesale_price"),
    stockQuantity: quantity("stock_quantity").default(0).notNull(),
    alertThreshold: quantity("alert_threshold").default(5).notNull(),
    expiryDate: timestamp("expiry_date", { withTimezone: true }),
    photoUrl: text("photo_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    index("products_shop_name_idx").on(table.shopId, table.name),
    uniqueIndex("products_shop_barcode_unique").on(table.shopId, table.barcode),
  ]
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    attributes: jsonb("attributes")
      .$type<Record<string, string>>()
      .default({})
      .notNull(),
    reference: varchar("reference", { length: 120 }),
    barcode: varchar("barcode", { length: 120 }),
    purchasePrice: money("purchase_price").default(0).notNull(),
    salePrice: money("sale_price").default(0).notNull(),
    stockQuantity: quantity("stock_quantity").default(0).notNull(),
    alertThreshold: quantity("alert_threshold").default(5).notNull(),
    photoUrl: text("photo_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    index("product_variants_shop_product_idx").on(
      table.shopId,
      table.productId
    ),
    uniqueIndex("product_variants_shop_barcode_unique").on(
      table.shopId,
      table.barcode
    ),
  ]
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    phone: varchar("phone", { length: 48 }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [index("customers_shop_name_idx").on(table.shopId, table.name)]
);

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    saleNumber: varchar("sale_number", { length: 40 }).notNull(),
    operationId: varchar("operation_id", { length: 96 }),
    subtotal: money("subtotal").default(0).notNull(),
    discountAmount: money("discount_amount").default(0).notNull(),
    total: money("total").default(0).notNull(),
    amountPaid: money("amount_paid").default(0).notNull(),
    creditAmount: money("credit_amount").default(0).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    paymentBreakdown: jsonb("payment_breakdown")
      .$type<Record<string, number>>()
      .default({})
      .notNull(),
    transactionCurrency: varchar("transaction_currency", { length: 8 })
      .default("XAF")
      .notNull(),
    exchangeRate: numeric("exchange_rate", {
      precision: 20,
      scale: 8,
      mode: "number",
    })
      .default(1)
      .notNull(),
    transactionSubtotal: money("transaction_subtotal").default(0).notNull(),
    transactionDiscountAmount: money("transaction_discount_amount")
      .default(0)
      .notNull(),
    transactionTotal: money("transaction_total").default(0).notNull(),
    transactionAmountPaid: money("transaction_amount_paid")
      .default(0)
      .notNull(),
    transactionPaymentBreakdown: jsonb("transaction_payment_breakdown")
      .$type<Record<string, number>>()
      .default({})
      .notNull(),
    status: saleStatusEnum("status").default("completed").notNull(),
    soldAt: timestamp("sold_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    uniqueIndex("sales_shop_number_unique").on(table.shopId, table.saleNumber),
    uniqueIndex("sales_shop_operation_unique").on(
      table.shopId,
      table.operationId
    ),
    index("sales_shop_sold_at_idx").on(table.shopId, table.soldAt),
  ]
);

export const saleItems = pgTable("sale_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  saleId: uuid("sale_id")
    .references(() => sales.id, { onDelete: "cascade" })
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "restrict" })
    .notNull(),
  productVariantId: uuid("product_variant_id").references(
    () => productVariants.id,
    { onDelete: "restrict" }
  ),
  productName: varchar("product_name", { length: 240 }).notNull(),
  quantity: quantity("quantity").notNull(),
  unitPrice: money("unit_price").notNull(),
  purchasePrice: money("purchase_price").notNull(),
  lineTotal: money("line_total").notNull(),
});

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "restrict" })
      .notNull(),
    productVariantId: uuid("product_variant_id").references(
      () => productVariants.id,
      { onDelete: "restrict" }
    ),
    saleId: uuid("sale_id").references(() => sales.id, {
      onDelete: "set null",
    }),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    type: movementTypeEnum("type").notNull(),
    quantityDelta: quantity("quantity_delta").notNull(),
    stockAfter: quantity("stock_after").notNull(),
    reason: varchar("reason", { length: 240 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    index("stock_movements_shop_created_idx").on(table.shopId, table.createdAt),
  ]
);

export const receivables = pgTable(
  "receivables",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    customerId: uuid("customer_id")
      .references(() => customers.id, { onDelete: "restrict" })
      .notNull(),
    saleId: uuid("sale_id")
      .references(() => sales.id, { onDelete: "restrict" })
      .notNull()
      .unique(),
    originalAmount: money("original_amount").notNull(),
    balance: money("balance").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    isSettled: boolean("is_settled").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    index("receivables_shop_customer_idx").on(table.shopId, table.customerId),
  ]
);

export const repayments = pgTable(
  "repayments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    receivableId: uuid("receivable_id")
      .references(() => receivables.id, { onDelete: "restrict" })
      .notNull(),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    operationId: varchar("operation_id", { length: 96 }),
    amount: money("amount").notNull(),
    paymentMethod: paymentMethodEnum("payment_method")
      .default("cash")
      .notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    uniqueIndex("repayments_shop_operation_unique").on(
      table.shopId,
      table.operationId
    ),
  ]
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    operationId: varchar("operation_id", { length: 96 }),
    category: varchar("category", { length: 120 }).notNull(),
    amount: money("amount").notNull(),
    note: text("note"),
    spentAt: timestamp("spent_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    uniqueIndex("expenses_shop_operation_unique").on(
      table.shopId,
      table.operationId
    ),
  ]
);

export const cashClosures = pgTable(
  "cash_closures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    businessDate: date("business_date").notNull(),
    expectedCash: money("expected_cash").notNull(),
    declaredCash: money("declared_cash").notNull(),
    difference: money("difference").notNull(),
    snapshot: jsonb("snapshot").$type<Record<string, number>>().notNull(),
    closedBy: uuid("closed_by")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    uniqueIndex("cash_closures_shop_date_unique").on(
      table.shopId,
      table.businessDate
    ),
    index("cash_closures_shop_date_idx").on(table.shopId, table.businessDate),
  ]
);

export const dataImports = pgTable(
  "data_imports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    fingerprint: varchar("fingerprint", { length: 128 }).notNull(),
    fileName: varchar("file_name", { length: 240 }).notNull(),
    summary: jsonb("summary").$type<Record<string, number>>().notNull(),
    importedBy: uuid("imported_by")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    uniqueIndex("data_imports_shop_fingerprint_unique").on(
      table.shopId,
      table.fingerprint
    ),
    index("data_imports_shop_created_idx").on(table.shopId, table.createdAt),
  ]
);

export const syncOperations = pgTable(
  "sync_operations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shopId: uuid("shop_id")
      .references(() => shops.id, { onDelete: "cascade" })
      .notNull(),
    operationId: varchar("operation_id", { length: 96 }).notNull(),
    kind: syncKindEnum("kind").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => [
    uniqueIndex("sync_operations_shop_operation_unique").on(
      table.shopId,
      table.operationId
    ),
  ]
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Shop = typeof shops.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Sale = typeof sales.$inferSelect;
