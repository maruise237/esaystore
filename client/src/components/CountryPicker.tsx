import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { BF, BJ, CF, CG, CI, CM, GA, GN, GQ, ML, NE, NG, SN, TD, TG } from "country-flag-icons/react/3x2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { countryPreferences, getCountryPreference, type CountryPreference } from "@/lib/countryPreferences";

const countryFlags = { BEN: BJ, BFA: BF, CAF: CF, CIV: CI, CMR: CM, COG: CG, GAB: GA, GIN: GN, GNQ: GQ, MLI: ML, NGA: NG, NER: NE, SEN: SN, TCD: TD, TGO: TG } as const;

export function CountryFlag({ country }: { country: string }) {
  const Flag = countryFlags[country as keyof typeof countryFlags] ?? CM;
  return <Flag aria-hidden="true" className="h-4 w-6 shrink-0 rounded-[2px] object-cover shadow-sm" />;
}

export function CountryPicker({ id, country, onChange, ariaDescribedBy }: { id: string; country: string; onChange: (preference: CountryPreference) => void; ariaDescribedBy?: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = getCountryPreference(country);
  const optionsId = `${id}-options`;
  const matches = countryPreferences.filter(preference => `${preference.label} ${preference.shortCode} ${preference.dialCode} ${preference.currency} ${preference.currencyLabel}`.toLocaleLowerCase("fr").includes(search.toLocaleLowerCase("fr").trim()));
  const choose = (preference: CountryPreference) => {
    onChange(preference);
    setSearch("");
    setOpen(false);
  };

  return <div className="relative"><Button id={id} type="button" variant="outline" role="combobox" aria-controls={optionsId} aria-expanded={open} aria-describedby={ariaDescribedBy} onClick={() => setOpen(value => !value)} onKeyDown={event => { if (event.key === "Escape") setOpen(false); }} className="h-11 w-full justify-between border-input bg-background px-3 font-normal text-[#27332d] hover:bg-[#f2f4eb] focus-visible:border-[#5e7b52] focus-visible:ring-[#5e7b52]/30"><span className="flex min-w-0 items-center gap-2 truncate"><CountryFlag country={selected.country} /><span className="truncate">{selected.label} ({selected.shortCode}) · {selected.dialCode} · {selected.currencyLabel}</span></span><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-[#5f695c]" aria-hidden="true" /></Button>{open && <div className="absolute z-30 mt-2 w-full rounded-xl border border-[#d8ddd2] bg-[#fdfcf7] p-2 shadow-[0_16px_36px_rgba(30,41,36,0.16)]"><Input autoFocus type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher un pays, un code ou une devise…" aria-label="Rechercher un pays" className="mb-2 h-10 bg-white" /><div id={optionsId} role="listbox" aria-label="Pays pris en charge" className="max-h-52 overflow-y-auto pr-1">{matches.length ? matches.map(preference => <button key={preference.country} type="button" role="option" aria-selected={preference.country === country} onClick={() => choose(preference)} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-sm text-[#27332d] transition-colors hover:bg-[#eef3df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e7b52]"><CountryFlag country={preference.country} /><span className="min-w-0 flex-1 truncate">{preference.label} ({preference.shortCode}) · {preference.dialCode}</span>{preference.country === country && <Check className="h-4 w-4 shrink-0 text-[#567b4f]" aria-hidden="true" />}</button>) : <p className="px-2 py-4 text-center text-sm text-[#697466]" role="status">Aucun pays correspondant.</p>}</div></div>}</div>;
}
