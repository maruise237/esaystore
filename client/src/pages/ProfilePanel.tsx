import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Store,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CountryPicker } from "@/components/CountryPicker";
import {
  formatPhoneNumber,
  getCountryPreference,
  isCompletePhoneNumber,
  normalizePhoneNumber,
} from "@/lib/countryPreferences";
import { trpc } from "@/lib/trpc";

export default function ProfilePanel({ shopId }: { shopId: string }) {
  const utils = trpc.useUtils();
  const settings = trpc.profile.settings.useQuery({ shopId });
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopContactPhone, setShopContactPhone] = useState("");
  const [country, setCountry] = useState("CMR");
  const [logoDraft, setLogoDraft] = useState<string | null | undefined>(
    undefined
  );
  const [logoError, setLogoError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const update = trpc.profile.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.profile.settings.invalidate({ shopId }),
        utils.shops.list.invalidate(),
        utils.currencies.settings.invalidate({ shopId }),
      ]);
      setNotice({
        kind: "success",
        message: "Modifications enregistrées avec succès.",
      });
    },
    onError: error => setNotice({ kind: "error", message: error.message }),
  });

  useEffect(() => {
    if (!settings.data) return;
    setShopName(settings.data.shop.name);
    setCountry(settings.data.shop.country);
    setShopAddress(settings.data.shop.address ?? "");
    setShopContactPhone(
      formatPhoneNumber(
        settings.data.shop.contactPhone ?? "",
        settings.data.shop.country
      )
    );
    setPhone(
      formatPhoneNumber(
        settings.data.user.phone ?? "",
        settings.data.shop.country
      )
    );
    setLogoDraft(undefined);
  }, [settings.data]);

  if (settings.isLoading)
    return (
      <div className="rounded-2xl border border-[#e4e1d7] bg-white p-6 text-sm text-[#687267]">
        Chargement de vos réglages…
      </div>
    );
  if (!settings.data)
    return (
      <div className="rounded-2xl border border-[#e8c0b6] bg-[#fff3ef] p-6 text-sm text-[#8d4a39]">
        Les réglages de profil ne peuvent pas être chargés pour le moment.
      </div>
    );

  const currentCountry = getCountryPreference(country);
  const phoneValid = !phone || isCompletePhoneNumber(phone, country);
  const canEditShop = settings.data.canEditShopSettings;
  const shopNameChanged = shopName.trim() !== settings.data.shop.name;
  const shopAddressChanged =
    shopAddress.trim() !== (settings.data.shop.address ?? "");
  const shopContactPhoneChanged =
    normalizePhoneNumber(shopContactPhone, country) !==
    (settings.data.shop.contactPhone ?? undefined);
  const countryChanged = country !== settings.data.shop.country;
  const phoneChanged =
    normalizePhoneNumber(phone, country) !==
    (settings.data.user.phone ?? undefined);
  const savedLogoUrl = settings.data.shop.logoUrl ?? null;
  const logoPreview = logoDraft === undefined ? savedLogoUrl : logoDraft;
  const logoChanged = logoDraft !== undefined && logoDraft !== savedLogoUrl;
  const shopContactPhoneValid =
    !shopContactPhone || isCompletePhoneNumber(shopContactPhone, country);
  const canSave =
    phoneValid &&
    shopContactPhoneValid &&
    (phoneChanged ||
      (canEditShop &&
        (countryChanged ||
          shopNameChanged ||
          shopAddressChanged ||
          shopContactPhoneChanged ||
          logoChanged)));

  const chooseLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!new Set(["image/png", "image/jpeg", "image/webp"]).has(file.type)) {
      setLogoError("Choisissez un fichier PNG, JPEG ou WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Le logo doit peser au maximum 2 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setLogoDraft(reader.result);
      setLogoError(null);
      setNotice(null);
    };
    reader.onerror = () =>
      setLogoError(
        "Le logo n’a pas pu être lu. Réessayez avec un autre fichier."
      );
    reader.readAsDataURL(file);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    await update.mutateAsync({
      shopId,
      ...(phoneChanged
        ? { phone: normalizePhoneNumber(phone, country) ?? null }
        : {}),
      ...(canEditShop && shopNameChanged ? { name: shopName.trim() } : {}),
      ...(canEditShop && shopAddressChanged
        ? { address: shopAddress.trim() || null }
        : {}),
      ...(canEditShop && shopContactPhoneChanged
        ? {
            contactPhone:
              normalizePhoneNumber(shopContactPhone, country) ?? null,
          }
        : {}),
      ...(canEditShop && countryChanged
        ? {
            country: country as
              | "BEN"
              | "BFA"
              | "CAF"
              | "CIV"
              | "CMR"
              | "COG"
              | "GAB"
              | "GIN"
              | "GNQ"
              | "MLI"
              | "NGA"
              | "NER"
              | "SEN"
              | "TCD"
              | "TGO",
          }
        : {}),
      ...(canEditShop && logoChanged ? { logoDataUrl: logoDraft } : {}),
    });
  };

  const lastUpdated = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(settings.data.shop.updatedAt));
  return (
    <div className="grid max-w-3xl gap-5">
      <Card className="border-[#e4e1d7] bg-white">
        <CardContent className="p-5 sm:p-7">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf0df] text-[#3d5839]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-serif text-2xl tracking-tight">
                Profil & boutique
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[#697466]">
                Gardez vos coordonnées et la configuration essentielle de votre
                boutique à jour.
              </p>
              <p className="mt-2 text-xs font-medium text-[#64715f]">
                Dernière mise à jour : {lastUpdated}
              </p>
            </div>
          </div>
          <form className="mt-6 grid gap-5" onSubmit={save}>
            {canEditShop && (
              <>
                <div className="grid gap-2">
                  <Label
                    htmlFor="profile-shop-name"
                    className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f695c]"
                  >
                    Nom de la boutique
                  </Label>
                  <Input
                    id="profile-shop-name"
                    required
                    minLength={2}
                    maxLength={120}
                    autoComplete="organization"
                    value={shopName}
                    onChange={event => setShopName(event.target.value)}
                  />
                  <p className="text-xs text-[#697466]">
                    Ce nom apparaît dans votre espace marchand et sur les reçus.
                  </p>
                </div>
                <section className="grid gap-4 rounded-2xl border border-[#e4e1d7] bg-[#faf9f5] p-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#29372e]">
                      Coordonnées sur les reçus
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#697466]">
                      Ajoutez les coordonnées à communiquer à vos clients. Elles
                      figureront sur les prochains reçus générés.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="profile-shop-address"
                      className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f695c]"
                    >
                      Adresse de la boutique
                    </Label>
                    <Textarea
                      id="profile-shop-address"
                      value={shopAddress}
                      onChange={event => setShopAddress(event.target.value)}
                      maxLength={280}
                      rows={2}
                      placeholder="Ex. Marché central, face à la pharmacie"
                      aria-describedby="profile-shop-address-hint"
                      className="resize-y bg-white"
                    />
                    <p
                      id="profile-shop-address-hint"
                      className="text-xs text-[#697466]"
                    >
                      Facultatif, 280 caractères maximum.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label
                      htmlFor="profile-shop-contact-phone"
                      className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f695c]"
                    >
                      Téléphone de la boutique
                    </Label>
                    <div className="relative">
                      <Input
                        id="profile-shop-contact-phone"
                        autoComplete="tel"
                        inputMode="tel"
                        value={shopContactPhone}
                        onChange={event =>
                          setShopContactPhone(
                            formatPhoneNumber(event.target.value, country)
                          )
                        }
                        placeholder={`${currentCountry.dialCode} 6 99 78 99 99`}
                        aria-describedby="profile-shop-contact-phone-hint"
                        className={
                          shopContactPhone && shopContactPhoneValid
                            ? "border-[#74a05d] pr-11"
                            : "bg-white"
                        }
                      />
                      {shopContactPhone && shopContactPhoneValid && (
                        <CheckCircle2
                          className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#567b4f]"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p
                      id="profile-shop-contact-phone-hint"
                      className={
                        shopContactPhone && !shopContactPhoneValid
                          ? "text-xs text-[#a05842]"
                          : "text-xs text-[#697466]"
                      }
                    >
                      {shopContactPhone && !shopContactPhoneValid
                        ? "Ajoutez encore quelques chiffres ou effacez ce champ."
                        : "Facultatif. Ce numéro est visible sur vos reçus, pas votre numéro personnel."}
                    </p>
                  </div>
                </section>
                <section className="grid gap-3 rounded-2xl border border-[#e4e1d7] bg-[#faf9f5] p-4 sm:grid-cols-[5.25rem_1fr]">
                  <div className="grid aspect-square w-[5.25rem] place-items-center overflow-hidden rounded-xl border border-[#dedbd2] bg-white text-[#60715f] shadow-[0_8px_18px_rgba(37,50,42,0.08)]">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt={`Aperçu du logo de ${shopName || "la boutique"}`}
                        className="h-full w-full object-contain p-1.5"
                      />
                    ) : (
                      <Store className="h-7 w-7" aria-hidden="true" />
                    )}
                  </div>
                  <div className="grid min-w-0 gap-2">
                    <Label
                      htmlFor="profile-shop-logo"
                      className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f695c]"
                    >
                      Logo de la boutique
                    </Label>
                    <Input
                      id="profile-shop-logo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={chooseLogo}
                      aria-describedby="profile-shop-logo-hint"
                      className="h-11 cursor-pointer bg-white text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#eaf0df] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#3d5839]"
                    />
                    <p
                      id="profile-shop-logo-hint"
                      className="text-xs leading-relaxed text-[#697466]"
                    >
                      PNG, JPEG ou WebP, 2 Mo maximum. L’aperçu est immédiat ;
                      le logo figurera sur vos prochains documents de vente
                      après enregistrement.
                    </p>
                    {logoError && (
                      <p
                        className="text-xs font-medium text-[#8d4a39]"
                        role="alert"
                      >
                        {logoError}
                      </p>
                    )}
                    {logoPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setLogoDraft(null);
                          setLogoError(null);
                          setNotice(null);
                        }}
                        className="h-9 w-fit px-2 text-[#8d4a39] hover:bg-[#fff0eb] hover:text-[#7a3b2d]"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Retirer le logo
                      </Button>
                    )}
                    {logoDraft !== undefined && !logoError && (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-[#3d5839]">
                        <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                        {logoDraft
                          ? "Nouveau logo prêt à enregistrer."
                          : "Le logo sera retiré après enregistrement."}
                      </p>
                    )}
                  </div>
                </section>
              </>
            )}
            <div className="grid gap-2">
              <Label
                htmlFor="profile-email"
                className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f695c]"
              >
                E-mail du compte
              </Label>
              <Input
                id="profile-email"
                readOnly
                value={settings.data.user.email ?? ""}
                className="bg-[#f7f6f1] text-[#697466]"
              />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="profile-phone"
                className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f695c]"
              >
                Téléphone personnel (facultatif)
              </Label>
              <div className="relative">
                <Input
                  id="profile-phone"
                  autoComplete="tel-national"
                  inputMode="tel"
                  value={phone}
                  onChange={event =>
                    setPhone(formatPhoneNumber(event.target.value, country))
                  }
                  placeholder={`${currentCountry.dialCode} 6 99 78 99 99`}
                  className={
                    phone && phoneValid ? "border-[#74a05d] pr-11" : ""
                  }
                />
                {phone && phoneValid && (
                  <CheckCircle2
                    className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#567b4f]"
                    aria-hidden="true"
                  />
                )}
              </div>
              {phone && !phoneValid ? (
                <p className="text-xs text-[#a05842]">
                  Ajoutez encore quelques chiffres ou effacez ce champ.
                </p>
              ) : (
                <p className="text-xs text-[#697466]">
                  Ce numéro reste lié à votre compte et n’apparaît pas sur les
                  reçus.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="profile-country"
                className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f695c]"
              >
                Pays, indicatif et devise
              </Label>
              {canEditShop ? (
                <CountryPicker
                  id="profile-country"
                  country={country}
                  onChange={preference => {
                    setCountry(preference.country);
                    setPhone(current =>
                      formatPhoneNumber(current, preference.country)
                    );
                  }}
                  ariaDescribedBy="profile-country-hint"
                />
              ) : (
                <div
                  id="profile-country"
                  className="flex min-h-11 items-center rounded-md border border-[#e4e1d7] bg-[#f7f6f1] px-3 text-sm text-[#697466]"
                >
                  {currentCountry.label} ({currentCountry.shortCode}) ·{" "}
                  {currentCountry.currencyLabel}
                </div>
              )}
              <p
                id="profile-country-hint"
                className="text-xs leading-relaxed text-[#697466]"
              >
                {canEditShop
                  ? `Le pays sélectionné associe automatiquement ${currentCountry.currencyLabel} comme devise de référence.`
                  : "Seul le propriétaire de la boutique peut modifier le pays et la devise de référence."}
              </p>
            </div>
            {notice && (
              <div
                className={
                  notice.kind === "success"
                    ? "flex items-center gap-2 rounded-xl border border-[#c6ddae] bg-[#eff6e7] px-3 py-2.5 text-sm font-medium text-[#3d5839]"
                    : "rounded-xl bg-[#fff3ef] px-3 py-2 text-sm text-[#8d4a39]"
                }
                role={notice.kind === "success" ? "status" : "alert"}
                aria-live="polite"
              >
                {notice.kind === "success" && (
                  <CheckCircle2
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                )}
                {notice.message}
              </div>
            )}
            <Button
              type="submit"
              disabled={!canSave || update.isPending}
              className="h-11 w-full bg-[#26352d] text-[#f5f7e8] hover:bg-[#1b2721] sm:w-auto sm:px-6"
            >
              {update.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                "Enregistrer les réglages"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
