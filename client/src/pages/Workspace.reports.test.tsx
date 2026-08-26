// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Reports } from "./Workspace";

const { useQuery } = vi.hoisted(() => ({
  useQuery: vi.fn(() => ({
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    data: {
      turnover: 24_000,
      grossMargin: 12_000,
      saleCount: 8,
      averageTicket: 3_000,
      expenses: 4_500,
      expenseCount: 2,
      creditAmount: 2_000,
      operatingResult: 7_500,
      changes: { turnover: 20, grossMargin: 10, expenses: -15, operatingResult: 35 },
      previous: { turnover: 20_000, grossMargin: 11_000, expenses: 5_000, operatingResult: 6_000 },
      topProducts: [{ name: "Savon local", quantity: 8, revenue: 12_000 }],
      expenseCategories: [{ category: "Transport", amount: 4_500 }],
      timeline: [{ label: "10 août", startAt: new Date("2026-08-10T00:00:00.000Z"), turnover: 12_000, expenses: 2_000, saleCount: 4 }, { label: "11 août", startAt: new Date("2026-08-11T00:00:00.000Z"), turnover: 12_000, expenses: 2_500, saleCount: 4 }],
    },
  })),
}));

vi.mock("@/lib/trpc", () => ({ trpc: { insights: { report: { useQuery } } } }));

vi.stubGlobal("ResizeObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

describe("rapports de l’espace marchand", () => {
  afterEach(cleanup);

  it("expose les raccourcis jour, semaine et l’historique détaillé", () => {
    render(<main><Reports shopId="00000000-0000-4000-8000-000000000001" currency="XAF" /></main>);
    expect(screen.getByRole("button", { name: "Aujourd’hui" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cette semaine" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "4 semaines" })).toBeTruthy();
    expect(screen.getByText("Résultat d’activité")).toBeTruthy();
    expect(screen.getByText("Dépenses par catégorie")).toBeTruthy();
    expect(screen.getByText("Savon local")).toBeTruthy();
    expect(screen.getByText("Consulter le détail de l’évolution")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Semaine" }));
    expect(useQuery).toHaveBeenLastCalledWith(expect.objectContaining({ granularity: "week" }));
  });

  it("does not introduce a structural accessibility violation", async () => {
    render(<main><Reports shopId="00000000-0000-4000-8000-000000000001" currency="XAF" /></main>);
    const result = await axe.run(document.body, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
});
