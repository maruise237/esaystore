import React from "react";
import { ScanLine, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PosCatalogSearch({
  query,
  onQueryChange,
  onOpenScanner,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  onOpenScanner: () => void;
}) {
  return (
    <div className="flex w-full gap-2 sm:w-auto">
      <div className="relative min-w-0 flex-1 sm:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#85877f]" />
        <Label htmlFor="pos-product-search" className="sr-only">
          Rechercher un produit dans la caisse
        </Label>
        <Input
          id="pos-product-search"
          value={query}
          onChange={event => onQueryChange(event.target.value)}
          className="pl-9"
          placeholder="Rechercher un produit"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onOpenScanner}
        className="h-11 shrink-0"
        title="Ouvrir le scanner de code-barres (F2)"
      >
        <ScanLine className="mr-2 h-4 w-4" />
        Scanner
        <kbd className="ml-2 hidden rounded border border-[#d9ddd3] bg-[#f7f8f4] px-1 py-0.5 text-[10px] font-semibold text-[#5f665d] lg:inline">
          F2
        </kbd>
      </Button>
    </div>
  );
}
