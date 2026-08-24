import { describe, expect, it } from "vitest";
import { isIosDevice, isStandaloneMode, shouldShowPwaInstallPrompt } from "./pwa";

describe("PWA install prompt", () => {
  it("shows the native installation action on an installable mobile browser", () => {
    expect(shouldShowPwaInstallPrompt({ isMobile: true, installed: false, dismissed: false, hasInstallEvent: true, ios: false })).toBe(true);
  });

  it("shows the iOS instruction fallback without beforeinstallprompt", () => {
    expect(isIosDevice("Mozilla/5.0 (iPhone)", "iPhone", 1)).toBe(true);
    expect(shouldShowPwaInstallPrompt({ isMobile: true, installed: false, dismissed: false, hasInstallEvent: false, ios: true })).toBe(true);
  });

  it("hides the invitation after installation, dismissal, or outside mobile", () => {
    expect(isStandaloneMode(true, undefined)).toBe(true);
    expect(shouldShowPwaInstallPrompt({ isMobile: true, installed: true, dismissed: false, hasInstallEvent: true, ios: false })).toBe(false);
    expect(shouldShowPwaInstallPrompt({ isMobile: true, installed: false, dismissed: true, hasInstallEvent: true, ios: false })).toBe(false);
    expect(shouldShowPwaInstallPrompt({ isMobile: false, installed: false, dismissed: false, hasInstallEvent: true, ios: false })).toBe(false);
  });
});
