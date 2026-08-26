// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Home from "./Home";

describe("landing EASYSTOR", () => {
  afterEach(cleanup);

  it("présente la promesse métier et dirige les actions vers l’authentification e-mail", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "Vendez vite. Gardez la main." })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Créer ma boutique" }).getAttribute("href")).toBe("/auth?mode=register");
    expect(screen.getAllByRole("link", { name: "Se connecter" }).every(link => link.getAttribute("href") === "/auth?mode=login")).toBe(true);
    expect(screen.getByText("Pensé pour les réseaux instables")).toBeTruthy();
    expect(screen.getAllByText("Aperçu illustratif de l’interface.").length).toBeGreaterThan(2);
  });

  it("rend la navigation mobile accessible sans introduire de contenu commercial non demandé", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le menu" }));

    expect(screen.getByRole("navigation", { name: "Navigation mobile" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Connexion" }).getAttribute("href")).toBe("/auth?mode=login");
    expect(screen.queryByText(/abonnement|tarif|facturation|annonce sponsorisée/i)).toBeNull();
  });

  it("garde une structure sans violation axe détectée", async () => {
    render(<Home />);
    const result = await axe.run(document.body, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
});
