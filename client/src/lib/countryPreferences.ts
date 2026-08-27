export type SupportedCurrency = "XAF" | "XOF" | "NGN";
export type CountryDetectionSource = "locale" | "timezone";

export type CountryPreference = {
  country: string;
  shortCode: string;
  flag: string;
  label: string;
  dialCode: string;
  currency: SupportedCurrency;
  currencyLabel: string;
};

const countries: readonly CountryPreference[] = [
  { country: "CMR", shortCode: "CM", flag: "🇨🇲", label: "Cameroun", dialCode: "+237", currency: "XAF", currencyLabel: "Franc CFA (XAF)" },
  { country: "CAF", shortCode: "CF", flag: "🇨🇫", label: "République centrafricaine", dialCode: "+236", currency: "XAF", currencyLabel: "Franc CFA (XAF)" },
  { country: "TCD", shortCode: "TD", flag: "🇹🇩", label: "Tchad", dialCode: "+235", currency: "XAF", currencyLabel: "Franc CFA (XAF)" },
  { country: "COG", shortCode: "CG", flag: "🇨🇬", label: "Congo", dialCode: "+242", currency: "XAF", currencyLabel: "Franc CFA (XAF)" },
  { country: "GNQ", shortCode: "GQ", flag: "🇬🇶", label: "Guinée équatoriale", dialCode: "+240", currency: "XAF", currencyLabel: "Franc CFA (XAF)" },
  { country: "GAB", shortCode: "GA", flag: "🇬🇦", label: "Gabon", dialCode: "+241", currency: "XAF", currencyLabel: "Franc CFA (XAF)" },
  { country: "BEN", shortCode: "BJ", flag: "🇧🇯", label: "Bénin", dialCode: "+229", currency: "XOF", currencyLabel: "Franc CFA (XOF)" },
  { country: "BFA", shortCode: "BF", flag: "🇧🇫", label: "Burkina Faso", dialCode: "+226", currency: "XOF", currencyLabel: "Franc CFA (XOF)" },
  { country: "CIV", shortCode: "CI", flag: "🇨🇮", label: "Côte d’Ivoire", dialCode: "+225", currency: "XOF", currencyLabel: "Franc CFA (XOF)" },
  { country: "GIN", shortCode: "GN", flag: "🇬🇳", label: "Guinée", dialCode: "+224", currency: "XOF", currencyLabel: "Franc CFA (XOF)" },
  { country: "MLI", shortCode: "ML", flag: "🇲🇱", label: "Mali", dialCode: "+223", currency: "XOF", currencyLabel: "Franc CFA (XOF)" },
  { country: "NER", shortCode: "NE", flag: "🇳🇪", label: "Niger", dialCode: "+227", currency: "XOF", currencyLabel: "Franc CFA (XOF)" },
  { country: "SEN", shortCode: "SN", flag: "🇸🇳", label: "Sénégal", dialCode: "+221", currency: "XOF", currencyLabel: "Franc CFA (XOF)" },
  { country: "TGO", shortCode: "TG", flag: "🇹🇬", label: "Togo", dialCode: "+228", currency: "XOF", currencyLabel: "Franc CFA (XOF)" },
  { country: "NGA", shortCode: "NG", flag: "🇳🇬", label: "Nigéria", dialCode: "+234", currency: "NGN", currencyLabel: "Naira nigérian (NGN)" },
];

export const countryPreferences = countries;
export const defaultCountryPreference = countries[0];

export function getCountryPreference(country: string | undefined): CountryPreference {
  return countries.find(preference => preference.country === country) ?? defaultCountryPreference;
}

function findByShortCode(shortCode: string | undefined) {
  return countries.find(preference => preference.shortCode === shortCode?.toUpperCase());
}

const timezoneCountries: Record<string, string> = {
  "Africa/Abidjan": "CIV",
  "Africa/Bamako": "MLI",
  "Africa/Bangui": "CAF",
  "Africa/Brazzaville": "COG",
  "Africa/Dakar": "SEN",
  "Africa/Douala": "CMR",
  "Africa/Libreville": "GAB",
  "Africa/Lagos": "NGA",
  "Africa/Lome": "TGO",
  "Africa/Ndjamena": "TCD",
  "Africa/Niamey": "NER",
  "Africa/Ouagadougou": "BFA",
};

export function detectCountryPreference(locale?: string, timeZone?: string): { preference: CountryPreference; source: CountryDetectionSource } | null {
  const region = locale?.match(/[-_]([A-Za-z]{2})\b/)?.[1];
  const localePreference = findByShortCode(region);
  if (localePreference) return { preference: localePreference, source: "locale" };

  const country = timeZone ? timezoneCountries[timeZone] : undefined;
  const timezonePreference = country ? getCountryPreference(country) : undefined;
  return timezonePreference ? { preference: timezonePreference, source: "timezone" } : null;
}
