// @vitest-environment jsdom
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SyncStatus from "./SyncStatus";

vi.mock("@/lib/offline", () => ({
  conflictCount: vi.fn(async () => 0),
  drainOutbox: vi.fn(async () => ({ synced: 0, pending: 0 })),
  pendingCount: vi.fn(async () => 0),
}));

const setOnline = (value: boolean) => {
  Object.defineProperty(window.navigator, "onLine", { configurable: true, value });
};

afterEach(() => setOnline(true));

describe("SyncStatus", () => {
  it("affiche un Wi-Fi vert et Online lorsque le réseau est disponible", async () => {
    setOnline(true);
    render(<SyncStatus />);
    const status = await screen.findByRole("button", { name: "Online" });
    expect(status.className).toContain("text-[#2f6e42]");
    expect(status.querySelector(".lucide-wifi")).toBeTruthy();
  });

  it("affiche un Wi-Fi barré rouge et Hors ligne lorsque le réseau est indisponible", async () => {
    setOnline(false);
    render(<SyncStatus />);
    const status = await screen.findByRole("button", { name: "Hors ligne" });
    await waitFor(() => expect((status as HTMLButtonElement).disabled).toBe(true));
    expect(status.className).toContain("text-[#a33d2c]");
    expect(status.querySelector(".lucide-wifi-off")).toBeTruthy();
  });
});
