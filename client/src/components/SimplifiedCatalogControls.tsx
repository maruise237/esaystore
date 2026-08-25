import React, { type ReactNode } from "react";

export function CatalogAdvancedOptions({ children }: { children: ReactNode }) {
  return (
    <details
      data-testid="catalog-advanced-options"
      className="mt-4 rounded-xl border border-[#d4e0c4] bg-white/65 px-4 py-3"
    >
      <summary className="cursor-pointer text-sm font-medium text-[#4d6849]">
        Ajouter des détails facultatifs
      </summary>
      {children}
    </details>
  );
}

export function VariantPanelToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="text-xs font-semibold text-[#4d6c47]"
    >
      {open ? "Fermer les variantes" : "+ Ajouter taille ou couleur"}
    </button>
  );
}
