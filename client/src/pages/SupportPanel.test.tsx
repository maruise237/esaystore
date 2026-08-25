// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SupportPanel from "./SupportPanel";

const mocks = vi.hoisted(() => ({ create: vi.fn(), invalidate: vi.fn() }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      support: {
        mine: { invalidate: mocks.invalidate },
        detail: { invalidate: mocks.invalidate },
      },
    }),
    support: {
      mine: { useQuery: () => ({ data: [], isLoading: false, error: null }) },
      detail: {
        useQuery: () => ({ data: undefined, isLoading: false, error: null }),
      },
      create: {
        useMutation: () => ({
          mutate: mocks.create,
          isPending: false,
          error: null,
        }),
      },
      reply: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }),
      },
      close: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }),
      },
    },
  },
}));

describe("zone Support utilisateur", () => {
  afterEach(() => {
    cleanup();
    mocks.create.mockReset();
  });

  it("propose un formulaire de demande accessible sans violation axe structurelle", async () => {
    render(
      <main>
        <SupportPanel shops={[{ id: "shop-1", name: "Boutique test" }]} />
      </main>
    );

    expect(screen.getByLabelText("Motif")).toBeTruthy();
    expect(screen.getByLabelText("Sujet")).toBeTruthy();
    expect(screen.getByLabelText("Décrivez le besoin")).toBeTruthy();
    const result = await axe.run(document.body, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations).toEqual([]);
  });

  it("envoie une demande avec le motif, la boutique, le sujet et le message", () => {
    render(<SupportPanel shops={[{ id: "shop-1", name: "Boutique test" }]} />);

    fireEvent.change(screen.getByLabelText("Boutique concernée (facultatif)"), {
      target: { value: "shop-1" },
    });
    fireEvent.change(screen.getByLabelText("Sujet"), {
      target: { value: "Erreur de caisse" },
    });
    fireEvent.change(screen.getByLabelText("Décrivez le besoin"), {
      target: { value: "La caisse ne charge plus ce matin." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer au support" }));

    expect(mocks.create).toHaveBeenCalledWith({
      category: "technical",
      shopId: "shop-1",
      subject: "Erreur de caisse",
      message: "La caisse ne charge plus ce matin.",
    });
  });
});
