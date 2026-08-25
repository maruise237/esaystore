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
        className="shrink-0"
      >
        <ScanLine className="mr-2 h-4 w-4" />
        Scanner
      </Button>
    </div>
  );
}
