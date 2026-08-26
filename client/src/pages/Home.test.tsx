// @vitest-environment jsdom
import React from "react";
import axe from "axe-core";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Home from "./Home";

describe("landing EASYSTOR", () => {
  afterEach(cleanup);

  it("présente la promesse métier, la migration de données et dirige les actions vers l’authentification e-mail", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "Vendez vite. Gardez la main." })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Créer ma boutique" }).every(link => link.getAttribute("href") === "/auth?mode=register")).toBe(true);
    expect(screen.getAllByRole("link", { name: "Se connecter" }).every(link => link.getAttribute("href") === "/auth?mode=login")).toBe(true);
    expect(screen.getByText("Pensé pour les réseaux instables")).toBeTruthy();
    expect(screen.getAllByText("Aperçu illustratif de l’interface.").length).toBeGreaterThan(2);
    expect(screen.getByRole("heading", { name: "Vos tableaux ne restent pas derrière." })).toBeTruthy();
    expect(screen.getAllByText(/Excel ou Google Sheets/i).length).toBeGreaterThan(1);
    expect(screen.getByRole("link", { name: "Importer mon activité" }).getAttribute("href")).toBe("/auth?mode=register");
    expect(screen.getByText(/Commencez avec toutes les fonctionnalités actuellement disponibles/i)).toBeTruthy();
    expect(screen.getByText(/Sans carte bancaire\. Sans paiement requis/i)).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Tarifs" }).every(link => link.getAttribute("href") === "#tarifs")).toBe(true);
    expect(screen.getByRole("heading", { name: "Tarifs simples. Départ gratuit." })).toBeTruthy();
    expect(screen.getByText("Gratuit aujourd’hui")).toBeTruthy();
    expect(screen.getByText(/Nous les annoncerons clairement avant tout changement/i)).toBeTruthy();
    const footerNavigation = screen.getByRole("navigation", { name: "Liens de fin de page" });
    expect(footerNavigation).toBeTruthy();
    expect(within(footerNavigation).getByRole("link", { name: "Migrer mes données" }).getAttribute("href")).toBe("#migration");
    expect(screen.getByRole("link", { name: "Connectez-vous pour écrire au support" }).getAttribute("href")).toBe("/auth?mode=login");
  });

  it("rend la navigation mobile accessible sans introduire de contenu commercial non demandé", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "Ouvrir le menu" }));

    expect(screen.getByRole("navigation", { name: "Navigation mobile" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Connexion" }).getAttribute("href")).toBe("/auth?mode=login");
    expect(screen.queryByText(/abonnement|facturation|annonce sponsorisée/i)).toBeNull();
  });

  it("garde une structure sans violation axe détectée", async () => {
    render(<Home />);
    const result = await axe.run(document.body, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
});
