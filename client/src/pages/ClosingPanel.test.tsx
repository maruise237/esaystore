// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ClosingPanel from "./ClosingPanel";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      closing: {
        preview: { invalidate: vi.fn() },
        list: { invalidate: vi.fn() },
      },
    }),
    closing: {
      preview: {
        useQuery: () => ({
          isLoading: false,
          data: {
            sale_count: 2,
            turnover: 3400,
            cash_sales: 2100,
            mobile_sales: 800,
            credit_sales: 500,
            cash_repayments: 0,
            expenses: 100,
            expected_cash: 2000,
            closure: null,
          },
        }),
      },
      list: { useQuery: () => ({ data: [] }) },
      close: {
        useMutation: () => ({ isPending: false, mutate: vi.fn(), error: null }),
      },
    },
  },
}));

describe("accessibilité de la clôture", () => {
  afterEach(cleanup);

  it("names the declared cash field and has no structural axe violation", async () => {
    render(<main><ClosingPanel shopId="shop-test" currency="XAF" /></main>);
    expect(screen.getByLabelText("Cash réellement compté")).toBeTruthy();
    const result = await axe.run(document.body, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  });
});
