export type BarcodeProduct = { id: string; barcode?: string | null; isActive?: boolean };

export function normalizeBarcode(value: string) {
  return value.replace(/[\s-]/g, "").trim();
}

export function findProductByBarcode<T extends BarcodeProduct>(products: T[], barcode: string) {
  const normalized = normalizeBarcode(barcode);
  return products.find((product) => product.isActive !== false && normalizeBarcode(product.barcode ?? "") === normalized);
}
