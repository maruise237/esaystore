// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import OfflineGuidePage from "./OfflineGuidePage";

describe("guide public hors connexion", () => {
  afterEach(() => { cleanup(); document.head.querySelector("#easystor-offline-guide-schema")?.remove(); });

  it("explique les opérations locales, les limites et la synchronisation sans promettre une activité sans contrôle", () => {
    render(<OfflineGuidePage />);
    expect(screen.getByRole("heading", { name: "Quand le réseau ralentit, votre caisse garde le fil." })).toBeTruthy();
    expect(screen.getByText(/Prévoyez une connexion avant d’utiliser une devise étrangère/i)).toBeTruthy();
    expect(screen.getByText("Puis-je vendre sans réseau ?")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: /Créer ma boutique|Ouvrir ma boutique/ }).every(link => link.getAttribute("href") === "/auth?mode=register")).toBe(true);
  });

  it("déclare les métadonnées et l’entité WebPage propres au guide", () => {
    render(<OfflineGuidePage />);
    expect(document.title).toBe("Travailler hors connexion avec votre caisse — EASYSTOR");
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://esaystor.kamtech.online/guides/travailler-hors-connexion");
    expect(document.head.querySelector("#easystor-offline-guide-schema")?.textContent).toContain('"@type":"WebPage"');
  });
});
