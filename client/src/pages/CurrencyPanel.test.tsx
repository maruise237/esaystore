// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CurrencyPanel from "./CurrencyPanel";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      currencies: {
        settings: { invalidate: vi.fn() },
        rates: { invalidate: vi.fn() },
      },
    }),
    currencies: {
      settings: {
        useQuery: () => ({
          data: {
            baseCurrency: "XAF",
            supportedCurrencies: ["XAF", "EUR"],
            currencies: [{ currency: "XAF", isActive: true, label: "Franc CFA" }],
          },
        }),
      },
      rates: { useQuery: () => ({ data: [] }) },
      setCurrency: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
      setRate: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn() }) },
    },
  },
}));

describe("accessibilité des devises", () => {
  afterEach(cleanup);

  it("nomme le sélecteur d’activation et ne présente aucune violation axe structurelle", async () => {
    render(<main><CurrencyPanel shopId="shop-test" /></main>);

    expect(screen.getByLabelText("Activer une devise")).toBeTruthy();
    const result = await axe.run(document.body, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  });
});
