// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CreditPanel from "./CreditPanel";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      catalog: { customers: { list: { invalidate: vi.fn() } } },
      commerce: { receivables: { list: { invalidate: vi.fn() } } },
      insights: { dashboard: { invalidate: vi.fn() } },
    }),
    catalog: {
      customers: {
        list: { useQuery: () => ({ data: [{ id: "customer-1", name: "Alice" }] }) },
        create: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      },
    },
    commerce: {
      receivables: {
        list: {
          useQuery: () => ({
            data: [{
              receivable: { id: "receivable-1", originalAmount: 1200, balance: 800, dueDate: null, createdAt: new Date(), isSettled: false },
              customerName: "Alice",
            }],
          }),
        },
        repay: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      },
    },
  },
}));

describe("accessibilité des créances", () => {
  afterEach(cleanup);

  it("associe chaque montant de remboursement à son client et ne présente aucune violation axe structurelle", async () => {
    render(<main><CreditPanel shopId="shop-test" currency="XAF" /></main>);

    expect(screen.getByLabelText("Montant à encaisser pour Alice")).toBeTruthy();
    const result = await axe.run(document.body, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  });
});
