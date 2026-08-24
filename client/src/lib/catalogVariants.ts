export function resolveCatalogPhoto(productPhoto?: string | null, variantPhoto?: string | null) {
  return variantPhoto || productPhoto || null;
}
