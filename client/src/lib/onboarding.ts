export type OnboardingStep = { id: "products" | "sale"; title: string; description: string; complete: boolean };

export function getOnboardingSteps(productCount: number, saleCount: number): OnboardingStep[] {
  return [
    { id: "products", title: "Ajouter vos premiers produits", description: "Créez au moins un article avec son prix et son stock.", complete: productCount > 0 },
    { id: "sale", title: "Enregistrer une première vente", description: "Passez en caisse pour vérifier le parcours complet.", complete: saleCount > 0 },
  ];
}
