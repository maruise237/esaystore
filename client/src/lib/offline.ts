import Dexie, { type Table } from "dexie";

export type SyncKind = "sale" | "repayment" | "expense" | "adjustment";
export type OutboxItem = { id?: number; sequence?: number; operationId: string; shopId: string; kind: SyncKind; payload: Record<string, unknown>; createdAt: Date; attempts: number; lastError?: string; status: "pending" | "conflict" };
type LocalSale = { id: string; operationId: string; shopId: string; total: number; createdAt: Date; syncStatus: "pending" | "synced" | "conflict" };
type LocalSaleItem = { id?: number; saleId: string; productId: string; name: string; quantity: number; unitPrice: number };
type LocalProduct = { id: string; shopId: string; name: string; barcode?: string | null; isActive?: boolean; unit?: string; salePrice: number; stockQuantity: number; updatedAt: Date };
type LocalCustomer = { id: string; shopId: string; name: string; phone?: string | null; updatedAt: Date };
type Conflict = { id?: number; operationId: string; shopId: string; kind: SyncKind; message: string; payload: Record<string, unknown>; createdAt: Date };

class EasyStorOfflineDatabase extends Dexie {
  products!: Table<LocalProduct, string>;
  customers!: Table<LocalCustomer, string>;
  sales!: Table<LocalSale, string>;
  saleItems!: Table<LocalSaleItem, number>;
  stockMovements!: Table<Record<string, unknown>, number>;
  outbox!: Table<OutboxItem, number>;
  conflicts!: Table<Conflict, number>;
  repayments!: Table<Record<string, unknown>, number>;
  expenses!: Table<Record<string, unknown>, number>;
  session!: Table<{ key: string; value: unknown }, string>;
  meta!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super("easystor-offline");
    this.version(1).stores({
      products: "id, shopId, name, updatedAt",
      customers: "id, shopId, name, updatedAt",
      sales: "id, operationId, shopId, createdAt, syncStatus",
      saleItems: "++id, saleId, productId",
      stockMovements: "++id, shopId, productId, createdAt",
      outbox: "++id, sequence, operationId, shopId, kind, status, createdAt",
      conflicts: "++id, operationId, shopId, kind, createdAt",
      repayments: "++id, shopId, receivableId, createdAt",
      expenses: "++id, shopId, createdAt",
      session: "key",
      meta: "key",
    });
  }
}

export const offlineDb = new EasyStorOfflineDatabase();

function emitStatus() {
  window.dispatchEvent(new Event("easystor-sync-status"));
}

export async function cacheProducts(items: Array<{ id: string; shopId: string; name: string; barcode?: string | null; isActive?: boolean; unit?: string; salePrice: number; stockQuantity: number; updatedAt: Date }>) {
  await offlineDb.products.bulkPut(items.map((item) => ({ ...item, updatedAt: new Date(item.updatedAt) })));
}

export async function cacheCustomers(items: Array<{ id: string; shopId: string; name: string; phone?: string | null; updatedAt: Date }>) {
  await offlineDb.customers.bulkPut(items.map((item) => ({ ...item, updatedAt: new Date(item.updatedAt) })));
}

export async function localProductsFor(shopId: string) {
  return offlineDb.products.where("shopId").equals(shopId).sortBy("name");
}

export async function localCustomersFor(shopId: string) {
  return offlineDb.customers.where("shopId").equals(shopId).sortBy("name");
}

export async function queueSale(payload: Record<string, unknown>, lines: Array<{ productId: string; name: string; quantity: number; price: number }>) {
  const operationId = String(payload.operationId);
  const saleId = `local-${operationId}`;
  const shopId = String(payload.shopId);
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0) - Number(payload.discountAmount ?? 0);
  const highestSequence = await offlineDb.outbox.orderBy("sequence").last();

  await offlineDb.transaction("rw", offlineDb.sales, offlineDb.saleItems, offlineDb.products, offlineDb.stockMovements, offlineDb.outbox, async () => {
    await offlineDb.sales.add({ id: saleId, operationId, shopId, total, createdAt: new Date(), syncStatus: "pending" });
    await offlineDb.saleItems.bulkAdd(lines.map((line) => ({ saleId, productId: line.productId, name: line.name, quantity: line.quantity, unitPrice: line.price })));
    for (const line of lines) {
      await offlineDb.products.where("id").equals(line.productId).modify((product) => { product.stockQuantity -= line.quantity; product.updatedAt = new Date(); });
      await offlineDb.stockMovements.add({ shopId, productId: line.productId, saleId, quantityDelta: -line.quantity, kind: "sale", createdAt: new Date() });
    }
    await offlineDb.outbox.add({ sequence: (highestSequence?.sequence ?? 0) + 1, operationId, shopId, kind: "sale", payload, createdAt: new Date(), attempts: 0, status: "pending" });
  });

  await registerBackgroundSync();
  emitStatus();
  return saleId;
}

export async function queueOperation(kind: Exclude<SyncKind, "sale">, payload: Record<string, unknown>) {
  const operationId = String(payload.operationId);
  const shopId = String(payload.shopId);
  const highestSequence = await offlineDb.outbox.orderBy("sequence").last();
  await offlineDb.transaction("rw", offlineDb.outbox, offlineDb.stockMovements, offlineDb.products, offlineDb.repayments, offlineDb.expenses, async () => {
    if (kind === "adjustment") {
      const productId = String(payload.productId);
      const delta = Number(payload.delta);
      await offlineDb.products.where("id").equals(productId).modify((product) => { product.stockQuantity += delta; product.updatedAt = new Date(); });
      await offlineDb.stockMovements.add({ shopId, productId, quantityDelta: delta, kind: payload.kind, reason: payload.reason, createdAt: new Date() });
    }
    if (kind === "repayment") await offlineDb.repayments.add({ ...payload, createdAt: new Date() });
    if (kind === "expense") await offlineDb.expenses.add({ ...payload, createdAt: new Date() });
    await offlineDb.outbox.add({ sequence: (highestSequence?.sequence ?? 0) + 1, operationId, shopId, kind, payload, createdAt: new Date(), attempts: 0, status: "pending" });
  });
  await registerBackgroundSync();
  emitStatus();
}

async function invokeTrpc(path: string, input: Record<string, unknown>) {
  const response = await fetch(`/api/trpc/${path}?batch=1`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ 0: { json: input } }),
  });
  if (!response.ok) throw new Error(`Synchronisation indisponible (${response.status})`);
  const envelope = (await response.json())[0];
  if (envelope?.error) {
    const error = new Error(envelope.error.json?.message ?? "Échec de synchronisation") as Error & { code?: string };
    error.code = envelope.error.json?.data?.code;
    throw error;
  }
  return envelope?.result?.data?.json;
}

const procedureFor: Record<SyncKind, string> = {
  sale: "commerce.sales.checkout",
  repayment: "commerce.receivables.repay",
  expense: "commerce.expenses.create",
  adjustment: "catalog.products.adjust",
};

export async function drainOutbox() {
  if (!navigator.onLine) return { synced: 0, pending: await pendingCount() };
  let synced = 0;
  const entries = await offlineDb.outbox.where("status").equals("pending").sortBy("sequence");
  for (const entry of entries) {
    try {
      await invokeTrpc(procedureFor[entry.kind], entry.payload);
      await offlineDb.transaction("rw", offlineDb.outbox, offlineDb.sales, async () => {
        await offlineDb.outbox.delete(entry.id!);
        if (entry.kind === "sale") await offlineDb.sales.where("operationId").equals(entry.operationId).modify({ syncStatus: "synced" });
      });
      synced += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      const conflict = (error as { code?: string }).code === "CONFLICT";
      await offlineDb.outbox.update(entry.id!, { attempts: entry.attempts + 1, lastError: message, status: conflict ? "conflict" : "pending" });
      if (conflict) {
        await offlineDb.conflicts.add({ operationId: entry.operationId, shopId: entry.shopId, kind: entry.kind, message, payload: entry.payload, createdAt: new Date() });
        if (entry.kind === "sale") await offlineDb.sales.where("operationId").equals(entry.operationId).modify({ syncStatus: "conflict" });
      }
      if (!conflict) break;
    }
  }
  emitStatus();
  return { synced, pending: await pendingCount() };
}

export async function pendingCount() { return offlineDb.outbox.where("status").equals("pending").count(); }
export async function conflictCount() { return offlineDb.conflicts.count(); }

export async function retryOutboxItem(id: number) {
  const item = await offlineDb.outbox.get(id);
  if (!item) return;
  await offlineDb.transaction("rw", offlineDb.outbox, offlineDb.conflicts, async () => {
    await offlineDb.outbox.update(id, { status: "pending", lastError: undefined });
    await offlineDb.conflicts.where("operationId").equals(item.operationId).delete();
  });
  emitStatus();
}

export async function removeOutboxItem(id: number) {
  const item = await offlineDb.outbox.get(id);
  if (!item) return;
  await offlineDb.transaction("rw", offlineDb.outbox, offlineDb.conflicts, offlineDb.sales, offlineDb.saleItems, offlineDb.products, async () => {
    if (item.kind === "sale") {
      const sale = await offlineDb.sales.where("operationId").equals(item.operationId).first();
      if (sale) {
        const lines = await offlineDb.saleItems.where("saleId").equals(sale.id).toArray();
        for (const line of lines) await offlineDb.products.where("id").equals(line.productId).modify((product) => { product.stockQuantity += line.quantity; product.updatedAt = new Date(); });
        await offlineDb.saleItems.where("saleId").equals(sale.id).delete();
        await offlineDb.sales.delete(sale.id);
      }
    }
    await offlineDb.conflicts.where("operationId").equals(item.operationId).delete();
    await offlineDb.outbox.delete(id);
  });
  emitStatus();
}

export async function purgeOfflineData() {
  await offlineDb.transaction("rw", [offlineDb.products, offlineDb.customers, offlineDb.sales, offlineDb.saleItems, offlineDb.stockMovements, offlineDb.outbox, offlineDb.conflicts, offlineDb.repayments, offlineDb.expenses, offlineDb.session, offlineDb.meta], async () => {
    await Promise.all([offlineDb.products.clear(), offlineDb.customers.clear(), offlineDb.sales.clear(), offlineDb.saleItems.clear(), offlineDb.stockMovements.clear(), offlineDb.outbox.clear(), offlineDb.conflicts.clear(), offlineDb.repayments.clear(), offlineDb.expenses.clear(), offlineDb.session.clear(), offlineDb.meta.clear()]);
  });
  if ("caches" in globalThis) {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("easystor-")).map((key) => caches.delete(key)));
  }
  emitStatus();
}

export async function registerBackgroundSync() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const syncRegistration = registration as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } };
  await syncRegistration.sync?.register("easystor-sync");
}

export function setupOfflineSync() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    navigator.serviceWorker.addEventListener("message", (event) => { if (event.data?.type === "EASYSTOR_SYNC") drainOutbox(); });
  }
  window.addEventListener("online", () => { drainOutbox(); });
}
