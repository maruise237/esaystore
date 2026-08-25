import { useEffect, useMemo, useState } from "react";
import {
  ImagePlus,
  Loader2,
  PackagePlus,
  Palette,
  Search,
  Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { canCreateEssentialProduct } from "@/lib/catalogFlow";
import {
  CatalogAdvancedOptions,
  VariantPanelToggle,
} from "@/components/SimplifiedCatalogControls";

const money = (value: number, currency: string) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
const initialProduct = {
  name: "",
  barcode: "",
  category: "",
  salePrice: "",
  purchasePrice: "",
  stockQuantity: "",
  alertThreshold: "5",
};
const initialVariant = {
  productId: "",
  name: "",
  color: "",
  size: "",
  barcode: "",
  salePrice: "",
  purchasePrice: "",
  stockQuantity: "",
  alertThreshold: "5",
};

async function imageData(file: File) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type))
    throw new Error("Choisissez une image PNG, JPEG ou WebP.");
  if (file.size > 2 * 1024 * 1024)
    throw new Error("L’image doit peser 2 Mo maximum.");
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("La photo n’a pas pu être lue."));
    reader.readAsDataURL(file);
  });
}

export default function CatalogPanel({
  shopId,
  currency,
  suggestedBarcode,
  suggestionKey,
  onBarcodeCreated,
}: {
  shopId: string;
  currency: string;
  suggestedBarcode?: string;
  suggestionKey?: string;
  onBarcodeCreated?: (barcode: string) => void;
}) {
  const utils = trpc.useUtils();
  const products = trpc.catalog.products.list.useQuery({ shopId });
  const variants = trpc.catalog.variants.list.useQuery({ shopId });
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState(initialProduct);
  const [variant, setVariant] = useState(initialVariant);
  const [photo, setPhoto] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [variantOpen, setVariantOpen] = useState(false);
  const createProduct = trpc.catalog.products.create.useMutation();
  const createVariant = trpc.catalog.variants.create.useMutation();
  const uploadPhoto = trpc.catalog.products.uploadPhoto.useMutation();

  useEffect(() => {
    if (suggestedBarcode)
      setProduct(current => ({ ...current, barcode: suggestedBarcode }));
  }, [suggestedBarcode, suggestionKey]);
  const refresh = () => {
    utils.catalog.products.list.invalidate({ shopId });
    utils.catalog.variants.list.invalidate({ shopId });
    utils.insights.dashboard.invalidate({ shopId });
  };
  const variantsFor = (id: string) =>
    variants.data?.filter(item => item.productId === id) ?? [];
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products.data ?? [];
    return (
      products.data?.filter(
        item =>
          `${item.name} ${item.category} ${item.barcode || ""}`
            .toLowerCase()
            .includes(needle) ||
          variantsFor(item.id).some(variantItem =>
            `${variantItem.name} ${variantItem.barcode || ""} ${Object.values(variantItem.attributes).join(" ")}`
              .toLowerCase()
              .includes(needle)
          )
      ) ?? []
    );
  }, [products.data, query, variants.data]);
  const selectedProduct = products.data?.find(
    item => item.id === variant.productId
  );
  const updateProduct = (key: keyof typeof product, value: string) =>
    setProduct(current => ({ ...current, [key]: value }));
  const updateVariant = (key: keyof typeof variant, value: string) =>
    setVariant(current => ({ ...current, [key]: value }));
  const loadPhoto = async (file?: File) => {
    if (!file) return;
    try {
      setPhoto(await imageData(file));
      setNotice(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Photo invalide.");
    }
  };
  const openVariant = (productId: string) => {
    setVariant({ ...initialVariant, productId });
    setVariantOpen(true);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const submitProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const created = await createProduct.mutateAsync({
        shopId,
        name: product.name,
        barcode: product.barcode || undefined,
        category: product.category || "Sans catégorie",
        salePrice: Number(product.salePrice),
        purchasePrice: Number(product.purchasePrice) || 0,
        stockQuantity: Number(product.stockQuantity) || 0,
        alertThreshold: Number(product.alertThreshold) || 0,
      });
      if (photo)
        await uploadPhoto.mutateAsync({
          shopId,
          target: "product",
          targetId: created.id,
          dataUrl: photo,
        });
      if (product.barcode) onBarcodeCreated?.(product.barcode);
      setProduct(initialProduct);
      setPhoto(null);
      setNotice(
        "Produit ajouté. Vous pouvez maintenant ajouter une variante si nécessaire."
      );
      refresh();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Le produit n’a pas pu être ajouté."
      );
    }
  };
  const submitVariant = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createVariant.mutateAsync({
        shopId,
        productId: variant.productId,
        name:
          variant.name ||
          [variant.color, variant.size].filter(Boolean).join(" · ") ||
          "Variante",
        attributes: Object.fromEntries(
          [
            ["Couleur", variant.color],
            ["Taille", variant.size],
          ].filter(([, value]) => Boolean(value))
        ),
        barcode: variant.barcode || undefined,
        salePrice: Number(variant.salePrice),
        purchasePrice: Number(variant.purchasePrice) || 0,
        stockQuantity: Number(variant.stockQuantity) || 0,
        alertThreshold: Number(variant.alertThreshold) || 0,
      });
      setVariant(initialVariant);
      setVariantOpen(false);
      setNotice("Variante ajoutée avec son stock propre.");
      refresh();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "La variante n’a pas pu être ajoutée."
      );
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-0 bg-[#edf1e3]">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d5e8a5] text-[#3f5d3d]">
                <PackagePlus className="h-5 w-5" />
              </div>
              <div>
                <p className="font-serif text-xl">Ajouter un produit</p>
                <p className="text-xs text-[#697868]">
                  Commencez par le nom, le prix et le stock.
                </p>
              </div>
            </div>
            <p className="text-xs font-medium text-[#5d7357]">
              Les détails sont facultatifs.
            </p>
          </div>
          <form onSubmit={submitProduct} className="mt-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_160px_130px]">
              <Field label="Nom du produit">
                <Input
                  autoFocus
                  value={product.name}
                  onChange={event => updateProduct("name", event.target.value)}
                  placeholder="Ex. Tee-shirt col rond"
                />
              </Field>
              <Field label="Prix de vente">
                <Input
                  inputMode="decimal"
                  value={product.salePrice}
                  onChange={event =>
                    updateProduct("salePrice", event.target.value)
                  }
                  placeholder="0"
                />
              </Field>
              <Field label="Stock">
                <Input
                  inputMode="decimal"
                  value={product.stockQuantity}
                  onChange={event =>
                    updateProduct("stockQuantity", event.target.value)
                  }
                  placeholder="0"
                />
              </Field>
            </div>
            <CatalogAdvancedOptions>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Catégorie">
                  <Input
                    value={product.category}
                    onChange={event =>
                      updateProduct("category", event.target.value)
                    }
                    placeholder="Ex. Vêtements"
                  />
                </Field>
                <Field label="Code-barres">
                  <Input
                    value={product.barcode}
                    onChange={event =>
                      updateProduct("barcode", event.target.value)
                    }
                  />
                </Field>
                <Field label="Prix d’achat">
                  <Input
                    inputMode="decimal"
                    value={product.purchasePrice}
                    onChange={event =>
                      updateProduct("purchasePrice", event.target.value)
                    }
                  />
                </Field>
                <Field label="Seuil d’alerte">
                  <Input
                    inputMode="decimal"
                    value={product.alertThreshold}
                    onChange={event =>
                      updateProduct("alertThreshold", event.target.value)
                    }
                  />
                </Field>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px]">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#b6c7a6] bg-white/80 p-3 text-sm text-[#4e6b48]">
                  <ImagePlus className="h-4 w-4" />
                  <span className="min-w-0 flex-1 truncate">
                    {photo ? "Photo prête" : "Ajouter une photo"}
                  </span>
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={event => loadPhoto(event.target.files?.[0])}
                  />
                </label>
                {photo && (
                  <img
                    src={photo}
                    alt="Aperçu du produit"
                    className="h-12 w-full rounded-xl object-cover"
                  />
                )}
              </div>
            </CatalogAdvancedOptions>
            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#758070]">
                Vous pourrez ajouter couleurs et tailles après l’enregistrement.
              </p>
              <Button
                type="submit"
                disabled={
                  createProduct.isPending ||
                  uploadPhoto.isPending ||
                  !canCreateEssentialProduct(product)
                }
                className="bg-[#415b3c] hover:bg-[#304a31]"
              >
                {(createProduct.isPending || uploadPhoto.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Enregistrer le produit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {variantOpen && (
        <Card className="border border-[#dce6be] bg-[#f9fbf2]">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e6f0d5] text-[#4d6c47]">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-serif text-xl">Ajouter une variante</p>
                  <p className="text-xs text-[#77846f]">
                    {selectedProduct
                      ? `Pour ${selectedProduct.name}`
                      : "Choisissez le produit concerné."}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setVariantOpen(false)}
              >
                Fermer
              </Button>
            </div>
            <form onSubmit={submitVariant} className="mt-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Produit">
                  <select
                    required
                    value={variant.productId}
                    onChange={event =>
                      updateVariant("productId", event.target.value)
                    }
                    className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                  >
                    <option value="">Choisir</option>
                    {products.data?.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Couleur">
                  <Input
                    value={variant.color}
                    onChange={event =>
                      updateVariant("color", event.target.value)
                    }
                    placeholder="Bleu"
                  />
                </Field>
                <Field label="Taille">
                  <Input
                    value={variant.size}
                    onChange={event =>
                      updateVariant("size", event.target.value)
                    }
                    placeholder="M"
                  />
                </Field>
                <Field label="Prix de vente">
                  <Input
                    required
                    inputMode="decimal"
                    value={variant.salePrice}
                    onChange={event =>
                      updateVariant("salePrice", event.target.value)
                    }
                    placeholder="0"
                  />
                </Field>
              </div>
              <details className="mt-4 rounded-xl border border-[#dce6be] bg-white px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium text-[#4d6c47]">
                  Ajouter stock, code-barres ou coût
                </summary>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Stock">
                    <Input
                      inputMode="decimal"
                      value={variant.stockQuantity}
                      onChange={event =>
                        updateVariant("stockQuantity", event.target.value)
                      }
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Code-barres">
                    <Input
                      value={variant.barcode}
                      onChange={event =>
                        updateVariant("barcode", event.target.value)
                      }
                    />
                  </Field>
                  <Field label="Prix d’achat">
                    <Input
                      inputMode="decimal"
                      value={variant.purchasePrice}
                      onChange={event =>
                        updateVariant("purchasePrice", event.target.value)
                      }
                    />
                  </Field>
                  <Field label="Seuil">
                    <Input
                      inputMode="decimal"
                      value={variant.alertThreshold}
                      onChange={event =>
                        updateVariant("alertThreshold", event.target.value)
                      }
                    />
                  </Field>
                </div>
              </details>
              <div className="mt-4 flex justify-end">
                <Button
                  disabled={
                    createVariant.isPending ||
                    !variant.productId ||
                    !variant.salePrice
                  }
                  type="submit"
                  className="bg-[#405a3e] hover:bg-[#304a31]"
                >
                  {createVariant.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Créer la variante
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]">
        <CardContent className="p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-serif text-xl">Vos produits</p>
              <p className="mt-1 text-xs text-[#85877f]">
                {visible.length} produit{visible.length > 1 ? "s" : ""} ·
                touchez une fiche pour gérer ses variantes.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#85877f]" />
              <Input
                value={query}
                onChange={event => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Rechercher un nom ou un code"
              />
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {visible.map(item => {
              const itemVariants = variantsFor(item.id);
              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-[#ece9df] bg-white"
                >
                  <div className="flex gap-3 p-4">
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt=""
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#edf1e3] text-[#64805e]">
                        <Tags className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs text-[#85877f]">
                        {itemVariants.length
                          ? `${itemVariants.length} variante${itemVariants.length > 1 ? "s" : ""}`
                          : `${item.stockQuantity} ${item.unit} en stock`}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#4f6c4b]">
                        {money(item.salePrice, currency)}
                      </p>
                    </div>
                  </div>
                  {itemVariants.length > 0 && (
                    <div className="border-t border-[#f0eee7] bg-[#fafaf7] px-4 py-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {itemVariants.slice(0, 3).map(variantItem => (
                          <span
                            key={variantItem.id}
                            className={cn(
                              "rounded-full px-2 py-1 text-[11px] font-medium",
                              variantItem.stockQuantity <=
                                variantItem.alertThreshold
                                ? "bg-[#fde6df] text-[#a85343]"
                                : "bg-[#e9f2df] text-[#4e6b48]"
                            )}
                          >
                            {variantItem.name}
                          </span>
                        ))}
                        {itemVariants.length > 3 && (
                          <span className="px-1 py-1 text-[11px] text-[#7a8476]">
                            +{itemVariants.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="border-t border-[#f0eee7] px-4 py-2.5">
                    <VariantPanelToggle
                      open={false}
                      onToggle={() => openVariant(item.id)}
                    />
                  </div>
                </article>
              );
            })}
            {visible.length === 0 && (
              <p className="col-span-full py-12 text-center text-sm text-[#85877f]">
                Aucun produit ne correspond à cette recherche.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      {notice && (
        <p className="rounded-xl bg-[#edf1e3] px-4 py-3 text-sm text-[#4e6b48]">
          {notice}
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <Label className="text-xs font-semibold text-[#5d6759]">{label}</Label>
      {children}
    </label>
  );
}
