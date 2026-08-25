export const adminTabs = [
  "overview",
  "shops",
  "users",
  "activity",
  "support",
] as const;

export type AdminTab = (typeof adminTabs)[number];

export function readAdminTab(hash = window.location.hash): AdminTab {
  const tab = hash.replace(/^#/, "");
  return adminTabs.includes(tab as AdminTab) ? (tab as AdminTab) : "overview";
}

export function saveAdminTab(tab: AdminTab) {
  const nextHash = tab === "overview" ? "" : `#${tab}`;
  if (window.location.hash === nextHash) return;
  window.history.pushState(
    { adminTab: tab },
    "",
    nextHash || window.location.pathname
  );
}
