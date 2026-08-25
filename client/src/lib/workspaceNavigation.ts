export const workspaceSections = [
  "dashboard",
  "pos",
  "products",
  "stock",
  "customers",
  "sales",
  "expenses",
  "reports",
  "closing",
  "migration",
  "currencies",
  "team",
  "sync",
  "support",
] as const;

export type WorkspaceSection = (typeof workspaceSections)[number];

export function readWorkspaceSection(hash = window.location.hash): WorkspaceSection {
  const section = hash.replace(/^#/, "");
  return workspaceSections.includes(section as WorkspaceSection)
    ? (section as WorkspaceSection)
    : "dashboard";
}

export function saveWorkspaceSection(section: WorkspaceSection) {
  const nextHash = section === "dashboard" ? "" : `#${section}`;
  if (window.location.hash === nextHash) return;
  window.history.pushState({ workspaceSection: section }, "", nextHash || window.location.pathname);
}
