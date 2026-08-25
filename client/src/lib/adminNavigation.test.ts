// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { readAdminTab, saveAdminTab } from "./adminNavigation";

describe("navigation de la console de plateforme", () => {
  beforeEach(() => window.history.replaceState({}, "", "/platform-admin"));

  it("restaure un onglet autorisé depuis l’URL", () => {
    expect(readAdminTab("#support")).toBe("support");
    expect(readAdminTab("#invalide")).toBe("overview");
  });

  it("enregistre les onglets dans l’historique sans hash pour le pilotage", () => {
    saveAdminTab("activity");
    expect(window.location.hash).toBe("#activity");
    saveAdminTab("overview");
    expect(window.location.hash).toBe("");
  });
});
