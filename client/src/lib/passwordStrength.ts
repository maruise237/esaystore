export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Très faible" | "Faible" | "Correct" | "Solide" | "Très solide";
};

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "Très faible" };
  const checks = [
    password.length >= 10,
    password.length >= 14,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const score = Math.min(4, Math.max(1, checks)) as PasswordStrength["score"];
  const labels: PasswordStrength["label"][] = ["Très faible", "Très faible", "Faible", "Correct", "Solide"];
  return { score, label: score === 4 && password.length >= 18 ? "Très solide" : labels[score] };
}
