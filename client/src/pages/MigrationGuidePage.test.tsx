// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import MigrationGuidePage from "./MigrationGuidePage";

describe("guide public de migration", () => {
  afterEach(() => {
    cleanup();
    document.head.querySelector("#easystor-migration-guide-schema")?.remove();
  });

  it("couvre une migration concrète depuis Excel ou Google Sheets et dirige vers le parcours d’inscription", () => {
    render(<MigrationGuidePage />);

    expect(screen.getByRole("heading", { name: "Passer d’Excel ou Google Sheets à une caisse et un stock organisés." })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Cinq étapes pour reprendre sans perdre le fil." })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: /Créer ma boutique|Ouvrir ma boutique/ }).every(link => link.getAttribute("href") === "/auth?mode=register")).toBe(true);
    expect(screen.getByText("Quels fichiers puis-je utiliser pour démarrer ?")).toBeTruthy();
  });

  it("déclare un titre, un canonical et une entité de page factuelle pour le guide", () => {
    render(<MigrationGuidePage />);

    expect(document.title).toBe("Migrer d’Excel ou Google Sheets vers une caisse — EASYSTOR");
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://esaystor.kamtech.online/guides/migrer-excel-google-sheets");
    expect(document.head.querySelector("#easystor-migration-guide-schema")?.textContent).toContain('"@type":"WebPage"');
    expect(document.head.querySelector("#easystor-migration-guide-schema")?.textContent).not.toContain("aggregateRating");
  });
});
