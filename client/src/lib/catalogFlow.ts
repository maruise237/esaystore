export type EssentialProductInput = {
  name: string;
  salePrice: string;
  stockQuantity: string;
  purchasePrice?: string;
};

export function canCreateEssentialProduct(input: EssentialProductInput) {
  return (
    Boolean(input.name.trim()) &&
    Number(input.salePrice) > 0 &&
    Number(input.stockQuantity || 0) >= 0
  );
}

export function isOptionalCatalogDetail(value?: string | null) {
  return Boolean(value?.trim());
}
