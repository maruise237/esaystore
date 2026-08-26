import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const robots = readFileSync(new URL("../public/robots.txt", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");

describe("fondations SEO et GEO", () => {
  it("déclare une métadonnée française, un canonical et des aperçus sociaux cohérents", () => {
    expect(indexHtml).toContain('lang="fr"');
    expect(indexHtml).toContain('rel="canonical" href="https://esaystor.kamtech.online/"');
    expect(indexHtml).toContain('property="og:type" content="website"');
    expect(indexHtml).toContain('name="twitter:card" content="summary"');
  });

  it("expose des entités structurées factuelles sans note, avis ni prix inventé", () => {
    expect(indexHtml).toContain('"@type": "WebApplication"');
    expect(indexHtml).toContain('"applicationCategory": "BusinessApplication"');
    expect(indexHtml).not.toContain('"aggregateRating"');
    expect(indexHtml).not.toContain('"review"');
    expect(indexHtml).not.toContain('"offers"');
  });

  it("laisse les robots explorer la landing et fournit un sitemap de la page publique", () => {
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Sitemap: https://esaystor.kamtech.online/sitemap.xml");
    expect(sitemap).toContain("<loc>https://esaystor.kamtech.online/</loc>");
    expect(sitemap).toContain("<loc>https://esaystor.kamtech.online/guides</loc>");
    expect(sitemap).toContain("<loc>https://esaystor.kamtech.online/guides/migrer-excel-google-sheets</loc>");
    expect(sitemap).toContain("<loc>https://esaystor.kamtech.online/guides/travailler-hors-connexion</loc>");
  });
});
