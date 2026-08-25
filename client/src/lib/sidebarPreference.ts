export const sidebarPreferenceKey = "easystor-desktop-sidebar";

export function parseSidebarCollapsed(value: string | null) {
  return value === "collapsed";
}

export function readSidebarCollapsed() {
  if (typeof window === "undefined") return false;
  try {
    return parseSidebarCollapsed(
      window.localStorage.getItem(sidebarPreferenceKey)
    );
  } catch {
    return false;
  }
}

export function saveSidebarCollapsed(collapsed: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      sidebarPreferenceKey,
      collapsed ? "collapsed" : "expanded"
    );
  } catch {
    // Le menu reste utilisable lorsqu’un navigateur bloque le stockage local.
  }
}
