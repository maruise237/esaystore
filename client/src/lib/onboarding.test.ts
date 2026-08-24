import { describe, expect, it } from "vitest";
import { getOnboardingSteps } from "./onboarding";

describe("démarrage guidé", () => {
  it("keeps only the essential initial steps", () => {
    expect(getOnboardingSteps(0, 0).map((step) => step.complete)).toEqual([false, false]);
    expect(getOnboardingSteps(2, 0).map((step) => step.complete)).toEqual([true, false]);
    expect(getOnboardingSteps(2, 1).every((step) => step.complete)).toBe(true);
  });
});
