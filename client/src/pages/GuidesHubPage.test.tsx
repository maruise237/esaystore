// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import GuidesHubPage from "./GuidesHubPage";

describe("hub public des guides", () => {
  afterEach(() => { cleanup(); document.head.querySelector("#easystor-guides-hub-schema")?.remove(); });

  it("donne un accès explicite aux deux guides pratiques et à l’inscription", () => {
    render(<GuidesHubPage />);
    expect(screen.getByRole("heading", { name: "Les guides pratiques pour tenir votre commerce." })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ouvrir le guide de migration" }).getAttribute("href")).toBe("/guides/migrer-excel-google-sheets");
    expect(screen.getByRole("link", { name: "Ouvrir le guide hors connexion" }).getAttribute("href")).toBe("/guides/travailler-hors-connexion");
    expect(screen.getByRole("link", { name: /Créer ma boutique/ }).getAttribute("href")).toBe("/auth?mode=register");
  });

  it("déclare la collection de guides avec un canonical propre", () => {
    render(<GuidesHubPage />);
    expect(document.title).toBe("Guides pratiques pour votre commerce — EASYSTOR");
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://esaystor.kamtech.online/guides");
    expect(document.head.querySelector("#easystor-guides-hub-schema")?.textContent).toContain('"@type":"CollectionPage"');
  });
});
