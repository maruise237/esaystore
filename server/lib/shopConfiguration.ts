export const configurableCountries = ["BEN", "BFA", "CAF", "CIV", "CMR", "COG", "GAB", "GIN", "GNQ", "MLI", "NGA", "NER", "SEN", "TCD", "TGO"] as const;
export type ConfigurableCountry = (typeof configurableCountries)[number];

const currencyByCountry: Record<ConfigurableCountry, "XAF" | "XOF" | "NGN"> = {
  BEN: "XOF", BFA: "XOF", CAF: "XAF", CIV: "XOF", CMR: "XAF", COG: "XAF", GAB: "XAF", GIN: "XOF", GNQ: "XAF", MLI: "XOF", NGA: "NGN", NER: "XOF", SEN: "XOF", TCD: "XAF", TGO: "XOF",
};

export function currencyForCountry(country: ConfigurableCountry) {
  return currencyByCountry[country];
}
