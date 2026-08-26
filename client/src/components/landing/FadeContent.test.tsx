// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FadeContent, HeroMotion } from "./FadeContent";

describe("composants de motion de landing", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("conserve le contenu et expose une cible de vérification pour la révélation au défilement", () => {
    render(<FadeContent><p>Migration EASYSTOR</p></FadeContent>);

    expect(screen.getByText("Migration EASYSTOR")).toBeTruthy();
    expect(document.querySelector('[data-motion="fade-content"]')).toBeTruthy();
  });

  it("isole l’entrée unique de la preuve produit du hero", () => {
    render(<HeroMotion><p>Preuve produit</p></HeroMotion>);

    expect(screen.getByText("Preuve produit")).toBeTruthy();
    expect(document.querySelector('[data-motion="hero-product-proof"]')).toBeTruthy();
  });

  it("préserve un contenu directement visible lorsque le mouvement réduit est demandé", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(<FadeContent><p>Contenu sans mouvement</p></FadeContent>);

    const content = document.querySelector<HTMLElement>('[data-motion="fade-content"]');
    expect(screen.getByText("Contenu sans mouvement")).toBeTruthy();
    expect(content?.style.opacity).not.toBe("0");
  });
});
