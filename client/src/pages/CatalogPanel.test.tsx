// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CatalogPanel from "./CatalogPanel";

const mutation = { isPending: false, mutateAsync: vi.fn() };

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      catalog: {
        products: { list: { invalidate: vi.fn() } },
        variants: { list: { invalidate: vi.fn() } },
      },
      insights: { dashboard: { invalidate: vi.fn() } },
    }),
    catalog: {
      products: {
        list: { useQuery: () => ({ data: [] }) },
        create: { useMutation: () => mutation },
        uploadPhoto: { useMutation: () => mutation },
      },
      variants: {
        list: { useQuery: () => ({ data: [] }) },
        create: { useMutation: () => mutation },
      },
    },
  },
}));

describe("accessibilité du catalogue", () => {
  afterEach(cleanup);

  it("names catalog search and has no structural axe violation", async () => {
    render(
      <main>
        <CatalogPanel shopId="shop-test" currency="XAF" />
      </main>
    );
    expect(screen.getByLabelText("Rechercher dans le catalogue")).toBeTruthy();
    const result = await axe.run(document.body, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  });
});
