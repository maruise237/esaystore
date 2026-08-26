// @vitest-environment jsdom
import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroGradientBlinds } from "./HeroGradientBlinds";

describe("fond Gradient Blinds EASYSTOR", () => {
  it("conserve le fond evergreen statique lorsque WebGL est indisponible", () => {
    render(<HeroGradientBlinds />);

    expect(document.querySelector('[data-gradient-blinds="easystor"]')).toBeNull();
  });
});
