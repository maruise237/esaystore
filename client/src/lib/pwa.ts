export function isIosDevice(userAgent: string, platform: string, maxTouchPoints: number) {
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1);
}

export function isStandaloneMode(mediaStandalone: boolean, navigatorStandalone: boolean | undefined) {
  return mediaStandalone || Boolean(navigatorStandalone);
}

export type PwaInstallSurface = "native" | "ios" | "browser" | "none";

export function getPwaInstallSurface({ installed, dismissed, hasInstallEvent, ios, isMobile }: { installed: boolean; dismissed: boolean; hasInstallEvent: boolean; ios: boolean; isMobile: boolean }): PwaInstallSurface {
  if (installed || dismissed) return "none";
  if (hasInstallEvent) return "native";
  if (!isMobile) return "none";
  if (ios) return "ios";
  return "browser";
}

export function shouldShowPwaInstallPrompt(input: { installed: boolean; dismissed: boolean; hasInstallEvent: boolean; ios: boolean; isMobile: boolean }) {
  return getPwaInstallSurface(input) !== "none";
}

export function shouldOfferPwaInstall(input: { isAuthenticated: boolean; installed: boolean; dismissed: boolean; hasInstallEvent: boolean; ios: boolean; isMobile: boolean }) {
  return input.isAuthenticated && shouldShowPwaInstallPrompt(input);
}
