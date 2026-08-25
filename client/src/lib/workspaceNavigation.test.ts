// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from "vitest";
import {
  readWorkspaceSection,
  saveWorkspaceSection,
} from "./workspaceNavigation";

describe("navigation de l’espace marchand", () => {
  beforeEach(() => window.history.replaceState({}, "", "/"));

  it("restaure une section connue depuis l’URL et revient au pilotage sinon", () => {
    expect(readWorkspaceSection("#pos")).toBe("pos");
    expect(readWorkspaceSection("#section-inconnue")).toBe("dashboard");
  });

  it("écrit les sections métier dans l’historique sans conserver de hash pour le pilotage", () => {
    saveWorkspaceSection("products");
    expect(window.location.hash).toBe("#products");
    saveWorkspaceSection("dashboard");
    expect(window.location.hash).toBe("");
  });
});
