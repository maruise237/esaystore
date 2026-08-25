import { describe, expect, it } from "vitest";
import { getPwaInstallSurface, isIosDevice, isStandaloneMode, shouldOfferPwaInstall, shouldShowPwaInstallPrompt } from "./pwa";

describe("PWA install prompt", () => {
  it("uses the browser-native installation action whenever it is available", () => {
    expect(getPwaInstallSurface({ installed: false, dismissed: false, hasInstallEvent: true, ios: false, isMobile: true })).toBe("native");
    expect(shouldShowPwaInstallPrompt({ installed: false, dismissed: false, hasInstallEvent: true, ios: false, isMobile: true })).toBe(true);
  });

  it("provides an iOS instruction fallback without beforeinstallprompt", () => {
    expect(isIosDevice("Mozilla/5.0 (iPhone)", "iPhone", 1)).toBe(true);
    expect(getPwaInstallSurface({ installed: false, dismissed: false, hasInstallEvent: false, ios: true, isMobile: true })).toBe("ios");
  });

  it("explains the browser menu path when native installation is not yet available", () => {
    expect(getPwaInstallSurface({ installed: false, dismissed: false, hasInstallEvent: false, ios: false, isMobile: true })).toBe("browser");
  });

  it("does not display an installation surface in a true standalone application", () => {
    expect(isStandaloneMode(true, undefined)).toBe(true);
    expect(getPwaInstallSurface({ installed: true, dismissed: false, hasInstallEvent: true, ios: false, isMobile: true })).toBe("none");
    expect(getPwaInstallSurface({ installed: false, dismissed: true, hasInstallEvent: true, ios: false, isMobile: true })).toBe("none");
    expect(getPwaInstallSurface({ installed: false, dismissed: false, hasInstallEvent: false, ios: false, isMobile: false })).toBe("none");
  });

  it("reserves the invitation for an authenticated user so it cannot interrupt registration", () => {
    const input = { installed: false, dismissed: false, hasInstallEvent: true, ios: false, isMobile: true };
    expect(shouldOfferPwaInstall({ ...input, isAuthenticated: false })).toBe(false);
    expect(shouldOfferPwaInstall({ ...input, isAuthenticated: true })).toBe(true);
  });
});
