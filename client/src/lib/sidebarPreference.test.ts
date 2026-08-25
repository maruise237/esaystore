import { describe, expect, it } from "vitest";
import { parseSidebarCollapsed } from "./sidebarPreference";

describe("préférence de barre latérale", () => {
  it("restores only the explicit compact preference", () => {
    expect(parseSidebarCollapsed("collapsed")).toBe(true);
    expect(parseSidebarCollapsed("expanded")).toBe(false);
    expect(parseSidebarCollapsed(null)).toBe(false);
  });
});
