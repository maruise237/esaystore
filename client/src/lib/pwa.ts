export function isIosDevice(userAgent: string, platform: string, maxTouchPoints: number) {
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1);
}

export function isStandaloneMode(mediaStandalone: boolean, navigatorStandalone: boolean | undefined) {
  return mediaStandalone || Boolean(navigatorStandalone);
}

export function shouldShowPwaInstallPrompt({
  isMobile,
  installed,
  dismissed,
  hasInstallEvent,
  ios,
}: {
  isMobile: boolean;
  installed: boolean;
  dismissed: boolean;
  hasInstallEvent: boolean;
  ios: boolean;
}) {
  return isMobile && !installed && !dismissed && (hasInstallEvent || ios);
}
