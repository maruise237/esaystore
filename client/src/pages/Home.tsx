import React, { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleCheck,
  CloudOff,
  CreditCard,
  Download,
  FileSpreadsheet,
  Menu,
  PackageCheck,
  ReceiptText,
  ScanBarcode,
  ShieldCheck,
  ShoppingBasket,
  Upload,
  Wifi,
  X,
} from "lucide-react";
import { FadeContent, HeroMotion } from "@/components/landing/FadeContent";
import { Button } from "@/components/ui/button";

const navigation = [
  { href: "#vendre", label: "Vendre" },
  { href: "#migrer", label: "Migrer mes données" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#hors-ligne", label: "Hors connexion" },
  { href: "#suivre", label: "Suivre l’activité" },
];

const operationalPoints = [
  "Caisse rapide, cash et mobile money",
  "Stock, catalogue et codes-barres au même endroit",
  "Créances, dépenses et clôture de caisse suivies",
  "Import et export compatibles avec Google Sheets",
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f7f5ee] text-[#243029]">
      <a
        className="sr-only fixed left-4 top-4 z-[60] rounded-md bg-[#d1e980] px-4 py-3 text-sm font-bold text-[#1e2924] focus:not-sr-only"
        href="#contenu-principal"
      >
        Aller au contenu
      </a>

      <header className="relative z-40 border-b border-white/10 bg-[#1e2924] text-[#f7f5ee]">
        <div className="container flex min-h-18 items-center justify-between gap-5 py-4">
          <a
            href="/"
            className="group inline-flex items-center gap-3 rounded-md font-serif text-[1.65rem] leading-none tracking-[-0.025em] focus-visible:outline-none"
            aria-label="EASYSTOR, accueil"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-[#d1e980] text-[#1e2924] transition-transform duration-150 ease-out group-hover:-rotate-3 group-active:scale-95 motion-reduce:transition-none">
              <ShoppingBasket className="size-[1.05rem]" aria-hidden="true" />
            </span>
            EASYSTOR
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#d8e0d6] lg:flex" aria-label="Navigation principale">
            {navigation.map(item => (
              <a
                className="rounded-md transition-colors duration-150 hover:text-[#d1e980] focus-visible:outline-none"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <a className="rounded-md px-2 py-2 text-sm font-semibold text-[#f7f5ee] underline-offset-4 hover:text-[#d1e980] hover:underline focus-visible:outline-none" href="/auth?mode=login">
              Se connecter
            </a>
            <Button asChild className="h-10 rounded-lg bg-[#d1e980] px-5 font-bold text-[#1e2924] shadow-[0_10px_24px_rgba(4,12,8,0.22)] hover:bg-[#e1f29b]">
              <a href="/auth?mode=register">Ouvrir ma boutique</a>
            </Button>
          </div>

          <button
            aria-controls="navigation-mobile"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            className="grid size-11 place-items-center rounded-lg border border-white/20 text-[#f7f5ee] transition-colors hover:border-[#d1e980] hover:text-[#d1e980] lg:hidden"
            onClick={() => setMobileMenuOpen(open => !open)}
            type="button"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <nav
            id="navigation-mobile"
            className="border-t border-white/10 bg-[#17221d] px-4 py-4 sm:hidden"
            aria-label="Navigation mobile"
          >
            <div className="mx-auto grid max-w-md gap-1">
              {navigation.map(item => (
                <a
                  className="rounded-lg px-4 py-3 text-sm font-semibold text-[#f7f5ee] hover:bg-white/10 focus-visible:outline-none"
                  href={item.href}
                  key={item.href}
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                <a className="grid min-h-11 place-items-center rounded-lg border border-white/20 px-3 text-sm font-bold text-[#f7f5ee] hover:border-[#d1e980]" href="/auth?mode=login" onClick={closeMobileMenu}>
                  Connexion
                </a>
                <a className="grid min-h-11 place-items-center rounded-lg bg-[#d1e980] px-3 text-sm font-bold text-[#1e2924] hover:bg-[#e1f29b]" href="/auth?mode=register" onClick={closeMobileMenu}>
                  Créer ma boutique
                </a>
              </div>
            </div>
          </nav>
        )}
      </header>

      <main id="contenu-principal">
        <section className="relative isolate overflow-hidden bg-[#1e2924] pb-16 pt-12 text-[#f7f5ee] sm:pb-24 sm:pt-18 lg:pb-30 lg:pt-24">
          <div className="pointer-events-none absolute right-[-14rem] top-[-18rem] size-[42rem] rounded-full bg-[#d1e980]/[0.075] blur-3xl" aria-hidden="true" />
          <div className="container relative grid items-center gap-14 lg:grid-cols-[0.96fr_1.04fr] lg:gap-12">
            <div className="max-w-2xl">
              <p className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-[#d1e980]">
                <span className="size-2 rounded-full bg-[#d1e980]" aria-hidden="true" />
                La caisse de proximité
              </p>
              <h1 className="max-w-[11ch] text-balance font-serif text-[clamp(3.35rem,6.5vw,5.85rem)] leading-[0.94] tracking-[-0.035em]">
                Vendez vite. Gardez la main.
              </h1>
              <p className="mt-7 max-w-[58ch] text-pretty text-lg leading-relaxed text-[#d5dfd3] sm:text-xl">
                EASYSTOR relie la caisse, le stock et le suivi de votre boutique dans une application pensée pour les journées qui ne s’arrêtent pas quand le réseau ralentit.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="h-12 rounded-lg bg-[#d1e980] px-6 text-base font-bold text-[#1e2924] shadow-[0_14px_30px_rgba(4,12,8,0.28)] hover:bg-[#e1f29b]">
                  <a href="/auth?mode=register">
                    Créer ma boutique <ArrowRight className="size-4" aria-hidden="true" />
                  </a>
                </Button>
                <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold text-[#f7f5ee] underline-offset-4 hover:text-[#d1e980] hover:underline focus-visible:outline-none" href="#vendre">
                  Découvrir l’application <ChevronRight className="size-4" aria-hidden="true" />
                </a>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-[#b9c7b7]">
                Inscription par e-mail, mot de passe et vérification de votre adresse. Vous pouvez aussi démarrer avec vos fichiers existants.
              </p>
            </div>

            <HeroMotion>
              <ProductProof />
            </HeroMotion>
          </div>
        </section>

        <section className="border-y border-[#d8d8cb] bg-[#eeece4] py-4" aria-label="Fonctions opérationnelles">
          <div className="container flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="font-serif text-xl text-[#26352d]">Une application pour tenir votre journée de commerce.</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#465645]">
              {operationalPoints.map(point => (
                <li className="inline-flex items-center gap-2" key={point}>
                  <Check className="size-4 text-[#567b4f]" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="vendre" className="scroll-mt-8 bg-[#f7f5ee] py-20 sm:py-28">
          <div className="container">
            <div className="max-w-2xl">
              <h2 className="font-serif text-4xl leading-[1.02] tracking-[-0.025em] text-[#243029] sm:text-5xl">
                À chaque vente, les bonnes informations avancent ensemble.
              </h2>
              <p className="mt-5 max-w-[65ch] text-lg leading-relaxed text-[#536153]">
                Encaissez, ajustez le stock et gardez l’historique lisible sans multiplier les carnets, tableaux et calculs de fin de journée.
              </p>
            </div>

            <div className="mt-14 grid gap-10 lg:mt-18 lg:gap-16">
              <article className="grid items-center gap-8 border-t border-[#cfd3c7] pt-8 lg:grid-cols-[0.77fr_1.23fr] lg:gap-16">
                <div>
                  <span className="grid size-11 place-items-center rounded-xl bg-[#e2ebbd] text-[#2c4430]"><ScanBarcode className="size-5" aria-hidden="true" /></span>
                  <h3 className="mt-5 font-serif text-3xl tracking-[-0.025em] text-[#243029]">Encaisser sans perdre le rythme</h3>
                  <p className="mt-4 max-w-[44ch] leading-relaxed text-[#536153]">Recherchez un article, scannez un code-barres ou saisissez-le. Le panier reste clair avant de confirmer le paiement.</p>
                  <a className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-bold text-[#304631] underline-offset-4 hover:underline focus-visible:outline-none" href="/auth?mode=register">
                    Démarrer avec ma boutique <ArrowRight className="size-4" aria-hidden="true" />
                  </a>
                </div>
                <CheckoutPreview />
              </article>

              <article className="grid items-center gap-8 border-t border-[#cfd3c7] pt-8 lg:grid-cols-[1.23fr_0.77fr] lg:gap-16">
                <StockPreview />
                <div className="lg:pl-4">
                  <span className="grid size-11 place-items-center rounded-xl bg-[#dceae4] text-[#28463b]"><PackageCheck className="size-5" aria-hidden="true" /></span>
                  <h3 className="mt-5 font-serif text-3xl tracking-[-0.025em] text-[#243029]">Voir le stock quand il faut agir</h3>
                  <p className="mt-4 max-w-[43ch] leading-relaxed text-[#536153]">Le catalogue, les variantes et les mouvements de stock restent accessibles depuis le même espace de travail.</p>
                </div>
              </article>

              <article className="grid items-center gap-8 border-t border-[#cfd3c7] pt-8 lg:grid-cols-[0.77fr_1.23fr] lg:gap-16">
                <div>
                  <span className="grid size-11 place-items-center rounded-xl bg-[#f0e7c9] text-[#5c4a25]"><BarChart3 className="size-5" aria-hidden="true" /></span>
                  <h3 className="mt-5 font-serif text-3xl tracking-[-0.025em] text-[#243029]">Suivre ce qui compte à la fermeture</h3>
                  <p className="mt-4 max-w-[44ch] leading-relaxed text-[#536153]">Ventes, dépenses, créances et clôture de caisse se lisent avec les informations nécessaires pour préparer demain.</p>
                </div>
                <ActivityPreview />
              </article>
            </div>
          </div>
        </section>

        <section id="migrer" className="scroll-mt-8 bg-[#e9e6dc] py-20 sm:py-28">
          <FadeContent className="container grid gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-16" direction="right">
            <div className="max-w-xl">
              <FileSpreadsheet className="size-7 text-[#46684a]" aria-hidden="true" />
              <h2 className="mt-5 font-serif text-4xl leading-[1.02] tracking-[-0.025em] text-[#243029] sm:text-5xl">Vos tableaux ne restent pas derrière.</h2>
              <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-[#536153]">
                Vous gérez déjà votre activité sur Excel ou Google Sheets&nbsp;? Importez votre fichier CSV ou XLSX. EASYSTOR vous aide à classer vos produits, ventes et données historiques avant de les ajouter à votre espace.
              </p>
              <p className="mt-5 max-w-[56ch] leading-relaxed text-[#536153]">
                Vous gardez aussi la possibilité d’exporter l’ensemble de votre activité dans un fichier unique, compatible avec Google Sheets. Vos données restent à vous.
              </p>
              <a className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-bold text-[#304631] underline-offset-4 hover:underline focus-visible:outline-none" href="/auth?mode=register">
                Importer mon activité <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </div>
            <MigrationPreview />
          </FadeContent>
        </section>

        <section id="tarifs" className="scroll-mt-8 border-y border-[#d8d8cb] bg-[#f7f5ee] py-20 sm:py-28" aria-labelledby="titre-tarifs">
          <FadeContent className="container" delay={0.06}>
            <div className="max-w-2xl">
              <h2 id="titre-tarifs" className="font-serif text-4xl leading-[1.02] tracking-[-0.025em] text-[#243029] sm:text-5xl">Tarifs simples. Départ gratuit.</h2>
              <p className="mt-5 max-w-[58ch] text-lg leading-relaxed text-[#536153]">Commencez avec toutes les fonctionnalités actuellement disponibles. Aucun paiement n’est demandé aujourd’hui.</p>
            </div>

            <div className="mt-12 grid gap-8 lg:mt-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch lg:gap-12">
              <article className="rounded-2xl bg-[#1e2924] p-7 text-[#f7f5ee] shadow-[0_18px_42px_rgba(30,41,36,0.18)] sm:p-9">
                <p className="text-sm font-bold text-[#d1e980]">Accès EASYSTOR</p>
                <p className="mt-5 font-serif text-4xl tracking-[-0.03em] sm:text-5xl">Gratuit aujourd’hui</p>
                <p className="mt-4 max-w-[38ch] leading-relaxed text-[#d1dcd0]">Sans carte bancaire. Sans paiement requis. Vous pouvez ouvrir votre boutique et utiliser les fonctions déjà disponibles.</p>
                <ul className="mt-7 space-y-3 text-sm text-[#e7ede5]">
                  {["Caisse, stock et catalogue", "Import, export et données historiques", "Créances, rapports et clôture de caisse", "Mode hors connexion et synchronisation"].map(item => (
                    <li className="flex items-start gap-3" key={item}><CircleCheck className="mt-0.5 size-4 shrink-0 text-[#d1e980]" aria-hidden="true" />{item}</li>
                  ))}
                </ul>
                <Button asChild size="lg" className="mt-9 h-12 rounded-lg bg-[#d1e980] px-6 text-base font-bold text-[#1e2924] hover:bg-[#e1f29b]">
                  <a href="/auth?mode=register">Créer ma boutique <ArrowRight className="size-4" aria-hidden="true" /></a>
                </Button>
              </article>

              <div className="flex flex-col justify-between rounded-2xl border border-[#d8ddd3] bg-[#eeece4] p-7 sm:p-9">
                <div>
                  <p className="font-serif text-3xl tracking-[-0.025em] text-[#26352d]">Et après&nbsp;?</p>
                  <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-[#465645]">Des tarifs pourront être proposés à l’avenir. Nous les annoncerons clairement avant tout changement.</p>
                  <p className="mt-4 max-w-[52ch] leading-relaxed text-[#5e6c5b]">Notre engagement est de garder EASYSTOR accessible et adapté aux réalités des commerces de proximité.</p>
                </div>
                <p className="mt-8 border-t border-[#d2d6cc] pt-5 text-sm font-semibold text-[#405140]">Aucune action de votre part n’est nécessaire pour profiter de l’accès gratuit actuel.</p>
              </div>
            </div>
          </FadeContent>
        </section>

        <section id="hors-ligne" className="scroll-mt-8 bg-[#2a3931] py-20 text-[#f7f5ee] sm:py-28">
          <FadeContent className="container grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16" direction="left">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 text-[#d1e980]"><CloudOff className="size-5" aria-hidden="true" /><span className="text-sm font-bold">Le travail ne s’arrête pas à une coupure.</span></div>
              <h2 className="mt-6 font-serif text-4xl leading-[1.02] tracking-[-0.025em] sm:text-5xl">Continuez d’avancer, même hors connexion.</h2>
              <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-[#d1dcd0]">Les opérations peuvent rester en attente localement, puis être synchronisées lorsque la connexion revient. Vous gardez une vue sur ce qui est parti et ce qui attend.</p>
              <div className="mt-8 inline-flex items-center gap-3 rounded-lg border border-[#d1e980]/25 bg-[#1e2924] px-4 py-3 text-sm font-semibold text-[#e6ecc8]">
                <Wifi className="size-4 text-[#d1e980]" aria-hidden="true" />
                Pensé pour les réseaux instables
              </div>
            </div>
            <OfflinePreview />
          </FadeContent>
        </section>

        <section id="suivre" className="scroll-mt-8 bg-[#e9e6dc] py-20 sm:py-28">
          <div className="container grid gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16">
            <div className="relative mx-auto w-full max-w-xl">
              <div className="rounded-2xl bg-[#fbfaf6] p-5 shadow-[0_18px_42px_rgba(40,50,42,0.13)] sm:p-7">
                <div className="flex items-start justify-between gap-4 border-b border-[#dde1d7] pb-5">
                  <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#657362]">Journal du jour</p><h3 className="mt-1 font-serif text-2xl text-[#26352d]">Vous gardez une trace nette.</h3></div>
                  <ReceiptText className="mt-1 size-6 text-[#456447]" aria-hidden="true" />
                </div>
                <dl className="divide-y divide-[#e0e2da] text-sm">
                  <div className="flex items-center justify-between gap-4 py-4"><dt className="font-semibold text-[#364637]">Reçu de vente</dt><dd className="font-medium text-[#536153]">Partageable après encaissement</dd></div>
                  <div className="flex items-center justify-between gap-4 py-4"><dt className="font-semibold text-[#364637]">Créances</dt><dd className="font-medium text-[#536153]">Règlements à suivre</dd></div>
                  <div className="flex items-center justify-between gap-4 py-4"><dt className="font-semibold text-[#364637]">Clôture de caisse</dt><dd className="font-medium text-[#536153]">Résumé quotidien</dd></div>
                </dl>
              </div>
              <p className="mt-4 px-2 text-xs font-medium text-[#657362]">Aperçu illustratif de l’interface.</p>
            </div>
            <div className="max-w-xl">
              <ShieldCheck className="size-7 text-[#46684a]" aria-hidden="true" />
              <h2 className="mt-5 font-serif text-4xl leading-[1.02] tracking-[-0.025em] text-[#243029] sm:text-5xl">Un suivi pratique, pour décider sans deviner.</h2>
              <p className="mt-6 max-w-[55ch] text-lg leading-relaxed text-[#536153]">Retrouvez les éléments qui comptent au bon moment : les ventes confirmées, les sorties de caisse, les créances à relancer et l’état de votre journée.</p>
              <a className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-bold text-[#304631] underline-offset-4 hover:underline focus-visible:outline-none" href="/auth?mode=login">Accéder à ma boutique <ArrowRight className="size-4" aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        <section className="bg-[#f7f5ee] py-20 sm:py-28">
          <div className="container">
            <div className="relative overflow-hidden rounded-2xl bg-[#1e2924] px-6 py-12 text-[#f7f5ee] shadow-[0_20px_55px_rgba(30,41,36,0.18)] sm:px-10 sm:py-16 lg:px-16">
              <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full border border-[#d1e980]/15" aria-hidden="true" />
              <div className="relative max-w-2xl">
                <h2 className="font-serif text-4xl leading-[1.02] tracking-[-0.025em] sm:text-5xl">Votre prochaine vente peut commencer ici.</h2>
                <p className="mt-5 max-w-[55ch] text-lg leading-relaxed text-[#d5dfd3]">Créez votre boutique, vérifiez votre e-mail, puis ajoutez votre premier article. EASYSTOR vous accompagne jusqu’à la première vente.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="h-12 rounded-lg bg-[#d1e980] px-6 text-base font-bold text-[#1e2924] hover:bg-[#e1f29b]"><a href="/auth?mode=register">Ouvrir ma boutique <ArrowRight className="size-4" aria-hidden="true" /></a></Button>
                  <Button asChild variant="outline" size="lg" className="h-12 rounded-lg border-white/25 px-6 text-base font-bold text-[#f7f5ee] hover:bg-white/10 hover:text-[#f7f5ee]"><a href="/auth?mode=login">J’ai déjà un compte</a></Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#cfd3c7] bg-[#f0eee7] py-8 text-sm text-[#536153]">
        <div className="container flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="font-serif text-xl text-[#26352d]">EASYSTOR</p>
          <p>La caisse et le stock pour les commerces de proximité.</p>
          <a className="font-semibold text-[#304631] underline-offset-4 hover:underline" href="/auth?mode=login">Se connecter</a>
        </div>
      </footer>
    </div>
  );
}

function ProductProof() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:mr-0">
      <div className="absolute -left-5 top-14 hidden w-42 rounded-xl border border-[#d1e980]/30 bg-[#26352d] p-4 text-[#f7f5ee] shadow-[0_16px_34px_rgba(3,10,6,0.25)] sm:block">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c8dc72]">Stock</p>
        <p className="mt-2 font-serif text-3xl">18</p>
        <p className="mt-1 text-xs leading-relaxed text-[#d1dcd0]">sachets disponibles</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#f7f5ee] p-3 text-[#26352d] shadow-[0_24px_60px_rgba(3,10,6,0.32)] sm:p-4">
        <div className="flex items-center justify-between border-b border-[#dcded5] px-2 pb-3 text-xs font-bold uppercase tracking-[0.11em] text-[#647260]"><span>Caisse</span><span className="inline-flex items-center gap-1 text-[#4a6c4c]"><CircleCheck className="size-3.5" aria-hidden="true" /> Prête</span></div>
        <div className="grid gap-4 p-2 pt-4 sm:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-bold">Panier en cours</p>
            <div className="mt-3 space-y-2">
              <PreviewLine name="Pain de mie" price="1 300 F" />
              <PreviewLine name="Lait concentré" price="900 F" />
              <PreviewLine name="Savon doux" price="700 F" />
            </div>
          </div>
          <div className="rounded-xl bg-[#e7ecd6] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#52654d]">À payer</p>
            <p className="mt-2 font-serif text-3xl tracking-[-0.03em]">2 900 F</p>
            <div className="mt-5 flex items-center gap-2 rounded-lg bg-[#1e2924] px-3 py-2.5 text-sm font-bold text-[#f7f5ee]"><CreditCard className="size-4 text-[#d1e980]" aria-hidden="true" /> Paiement cash</div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-right text-xs font-medium text-[#b9c7b7]">Aperçu illustratif de l’interface.</p>
    </div>
  );
}

function PreviewLine({ name, price }: { name: string; price: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-lg border border-[#e0e1d9] bg-white px-3 py-2.5 text-sm"><span className="font-medium">{name}</span><span className="font-semibold text-[#425641]">{price}</span></div>;
}

function CheckoutPreview() {
  return (
    <div className="overflow-hidden rounded-2xl bg-[#26352d] p-5 text-[#f7f5ee] shadow-[0_16px_42px_rgba(35,48,41,0.16)] sm:p-7">
      <div className="flex items-center justify-between"><span className="font-serif text-2xl">Caisse rapide</span><span className="rounded-full bg-[#d1e980] px-3 py-1 text-xs font-bold text-[#243029]">Panier prêt</span></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[{ icon: ScanBarcode, title: "Scanner", text: "Ajouter sans chercher" }, { icon: CreditCard, title: "Encaisser", text: "Choisir le paiement" }, { icon: ReceiptText, title: "Partager", text: "Garder le reçu" }].map(({ icon: Icon, title, text }) => <div className="border-t border-white/15 pt-4" key={title}><Icon className="size-5 text-[#d1e980]" aria-hidden="true" /><p className="mt-4 font-bold">{title}</p><p className="mt-1 text-sm leading-relaxed text-[#c9d4c8]">{text}</p></div>)}
      </div>
    </div>
  );
}

function StockPreview() {
  return (
    <div className="rounded-2xl bg-[#dceae4] p-5 sm:p-7">
      <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#4c6759]">Catalogue</p><h4 className="mt-1 font-serif text-2xl text-[#263a30]">Stock à suivre</h4></div><PackageCheck className="size-7 text-[#456b52]" aria-hidden="true" /></div>
      <div className="mt-6 grid gap-3"><StockLine product="Jus orange" detail="24 en stock" tone="ok" /><StockLine product="Riz parfumé" detail="À réapprovisionner" tone="alert" /><StockLine product="Savon doux" detail="3 variantes" tone="neutral" /></div>
      <p className="mt-4 text-xs font-medium text-[#506c5c]">Aperçu illustratif de l’interface.</p>
    </div>
  );
}

function StockLine({ product, detail, tone }: { product: string; detail: string; tone: "ok" | "alert" | "neutral" }) {
  const dotClass = tone === "ok" ? "bg-[#5b8455]" : tone === "alert" ? "bg-[#a76c43]" : "bg-[#7b887b]";
  return <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f9fbf7] px-4 py-3 text-sm shadow-[0_5px_12px_rgba(45,76,60,0.08)]"><span className="font-semibold text-[#304432]">{product}</span><span className="inline-flex items-center gap-2 text-right font-medium text-[#536a5b]"><span className={`size-2 rounded-full ${dotClass}`} aria-hidden="true" />{detail}</span></div>;
}

function MigrationPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#d6d9ce] bg-[#fdfcf8] shadow-[0_18px_42px_rgba(46,55,43,0.11)]">
      <div className="flex items-center justify-between gap-4 border-b border-[#e0e1da] px-5 py-4 sm:px-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#667463]">Migration de données</p>
          <h3 className="mt-1 font-serif text-2xl text-[#26352d]">Votre activité, prête à reprendre.</h3>
        </div>
        <FileSpreadsheet className="size-6 text-[#526f51]" aria-hidden="true" />
      </div>
      <ol className="divide-y divide-[#e0e1da] px-5 sm:px-7">
        <MigrationStep icon={Upload} title="Importer un fichier" detail="CSV ou XLSX depuis Excel ou Google Sheets" />
        <MigrationStep icon={ReceiptText} title="Vérifier avant d’ajouter" detail="Produits, ventes et dates sont organisés pour vous" />
        <MigrationStep icon={Download} title="Exporter quand vous le souhaitez" detail="Un fichier global compatible avec Google Sheets" />
      </ol>
      <p className="px-5 py-3 text-xs font-medium text-[#6c7669] sm:px-7">Aperçu illustratif du parcours de migration.</p>
    </div>
  );
}

function MigrationStep({ icon: Icon, title, detail }: { icon: typeof Upload; title: string; detail: string }) {
  return <li className="flex items-start gap-4 py-5"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#e7ecd6] text-[#35523a]"><Icon className="size-4" aria-hidden="true" /></span><div><p className="font-semibold text-[#30432f]">{title}</p><p className="mt-1 text-sm leading-relaxed text-[#5a6858]">{detail}</p></div></li>;
}

function ActivityPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#d6d9ce] bg-[#fdfcf8] shadow-[0_14px_32px_rgba(46,55,43,0.09)]">
      <div className="flex items-center justify-between border-b border-[#e0e1da] px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#667463]">Vue du jour</p><h4 className="mt-1 font-serif text-2xl text-[#26352d]">Activité de la boutique</h4></div><BarChart3 className="size-6 text-[#526f51]" aria-hidden="true" /></div>
      <div className="grid divide-y divide-[#e1e2da] sm:grid-cols-3 sm:divide-x sm:divide-y-0"><Metric label="Ventes" value="Aujourd’hui" /><Metric label="Créances" value="À suivre" /><Metric label="Clôture" value="À préparer" /></div>
      <p className="px-5 py-3 text-xs font-medium text-[#6c7669]">Aperçu illustratif de l’interface.</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="px-5 py-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6a7666]">{label}</p><p className="mt-2 text-sm font-semibold text-[#30432f]">{value}</p></div>;
}

function OfflinePreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#203028] shadow-[0_18px_48px_rgba(4,12,8,0.24)]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#d1e980] text-[#1e2924]"><CloudOff className="size-4" aria-hidden="true" /></span><div><p className="font-bold">Synchronisation</p><p className="text-xs text-[#afc0ae]">État des opérations locales</p></div></div><span className="rounded-full border border-[#d1e980]/35 px-3 py-1 text-xs font-bold text-[#d1e980]">Hors connexion</span></div>
      <ol className="divide-y divide-white/10 px-5 py-2">
        <SyncLine title="Vente enregistrée" detail="En attente de synchronisation" state="waiting" />
        <SyncLine title="Ajustement de stock" detail="En attente de synchronisation" state="waiting" />
        <SyncLine title="Connexion retrouvée" detail="Prête à reprendre" state="ready" />
      </ol>
      <div className="flex items-center gap-2 bg-[#18241e] px-5 py-4 text-sm font-semibold text-[#dce8d8]"><Wifi className="size-4 text-[#d1e980]" aria-hidden="true" /> La file sera traitée lorsque le réseau revient.</div>
      <p className="px-5 py-3 text-xs font-medium text-[#afc0ae]">Aperçu illustratif de l’interface.</p>
    </div>
  );
}

function SyncLine({ title, detail, state }: { title: string; detail: string; state: "waiting" | "ready" }) {
  return <li className="flex items-center gap-4 py-4"><span className={`size-2.5 rounded-full ${state === "ready" ? "bg-[#d1e980]" : "bg-[#c7ad62]"}`} aria-hidden="true" /><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-[#aec0ad]">{detail}</p></div></li>;
}
