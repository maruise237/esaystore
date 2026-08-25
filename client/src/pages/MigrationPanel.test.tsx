// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MigrationPanel from "./MigrationPanel";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    migration: {
      preview: {
        useMutation: () => ({
          data: null,
          mutate: vi.fn(),
          reset: vi.fn(),
          isPending: false,
        }),
      },
      exportData: {
        useQuery: () => ({
          refetch: vi.fn(),
          data: undefined,
          isFetching: false,
        }),
      },
      run: {
        useMutation: () => ({
          isPending: false,
          mutate: vi.fn(),
          reset: vi.fn(),
          error: null,
        }),
      },
    },
  },
}));

describe("accessibilité de la migration", () => {
  afterEach(cleanup);

  it("names the spreadsheet selection control and has no structural axe violation", async () => {
    render(
      <main>
        <MigrationPanel shopId="shop-test" />
      </main>
    );
    expect(screen.getByLabelText("Sélectionner")).toBeTruthy();
    const result = await axe.run(document.body, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  });
});
