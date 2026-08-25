import { describe, expect, it } from "vitest";
import { shouldShowPwaUpdate } from "./pwaUpdate";

describe("mise à jour PWA", () => {
  it("propose un rechargement seulement à une application installée déjà contrôlée", () => {
    expect(
      shouldShowPwaUpdate({ standalone: true, hadExistingController: true })
    ).toBe(true);
    expect(
      shouldShowPwaUpdate({ standalone: false, hadExistingController: true })
    ).toBe(false);
    expect(
      shouldShowPwaUpdate({ standalone: true, hadExistingController: false })
    ).toBe(false);
  });
});
