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
  Upload,
  Wifi,
  X,
} from "lucide-react";
import { HeroMotion } from "@/components/landing/FadeContent";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";

const navigation = [
  { href: "#migrer", label: "Reprendre mes tableaux" },
  { href: "#vendre", label: "Vendre" },
  { href: "#suivre", label: "Suivre l’activité" },
  { href: "#hors-ligne", label: "Hors connexion" },
  { href: "#tarifs", label: "Tarifs" },
];

const proofPoints = [
  "Vos fichiers reprennent leur place et restent à vous",
  "Vous continuez même si le réseau ralentit",
  "Vos devises réelles restent les vôtres",
];

const frequentlyAskedQuestions = [
  {
    question: "Qu’est-ce qu’EASYSTOR ?",
    answer:
      "EASYSTOR aide les commerces de proximité à encaisser, suivre le stock et garder une trace claire de l’activité. Les ventes, dépenses, créances, clôtures et rapports restent réunis dans le même espace.",
  },
  {
    question: "Puis-je importer mes fichiers Excel ou Google Sheets ?",
    answer:
      "Oui. Importez un fichier CSV ou XLSX issu d’Excel ou de Google Sheets. Avant l’ajout, vous voyez les produits, ventes, achats et dates reconnus afin de vérifier ce qui va reprendre sa place.",
  },
  {
    question: "Puis-je récupérer mes données plus tard ?",
    answer:
      "Oui. L’export global réunit vos données dans un fichier unique compatible avec Google Sheets. Vos données restent à vous, aujourd’hui comme demain.",
  },
  {
    question: "Que se passe-t-il si le réseau ralentit ?",
    answer:
      "Vous pouvez continuer certaines opérations. Elles restent prêtes sur l’appareil puis partent lorsque la connexion revient, avec un état clair pour savoir ce qui attend encore.",
  },
  {
    question: "EASYSTOR est-il payant aujourd’hui ?",
    answer:
      "Non. Les fonctionnalités actuellement disponibles sont gratuites, sans carte bancaire ni paiement requis. Si cela doit changer, l’information sera annoncée clairement avant tout changement.",
  },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f7f7f8] text-[#111827]">
      <a
        className="sr-only fixed left-4 top-4 z-[60] rounded-lg bg-[#232ac3] px-4 py-3 text-sm font-bold text-white focus:not-sr-only"
        href="#contenu-principal"
      >
        Aller au contenu
      </a>

      <header className="relative z-40 border-b border-[#e5e7eb] bg-white text-[#111827]">
        <div className="container flex min-h-[72px] items-center justify-between gap-3 py-3 sm:gap-5">
          <a
            href="/"
            className="group inline-flex min-w-0 items-center gap-2.5 rounded-lg text-xl font-extrabold tracking-[-0.03em] text-[#111827] focus-visible:outline-none sm:text-2xl"
            aria-label="EASYSTOR, accueil"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#232ac3] text-white transition-transform duration-150 ease-out group-hover:-rotate-2 group-active:scale-[0.96] motion-reduce:transition-none">
              <BrandMark className="size-[1.05rem]" />
            </span>
            EASYSTOR
          </a>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-[#4b5563] xl:flex" aria-label="Navigation principale">
            {navigation.map(item => (
              <a
                className="rounded-md px-1 py-2 transition-colors duration-150 hover:text-[#232ac3] focus-visible:outline-none"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a className="rounded-md px-2 py-2 text-sm font-semibold text-[#374151] underline-offset-4 hover:text-[#232ac3] hover:underline focus-visible:outline-none" href="/auth?mode=login">
              Se connecter
            </a>
            <Button asChild className="h-11 rounded-xl bg-[#232ac3] px-5 font-bold text-white shadow-[0_12px_24px_rgba(35,42,195,0.18)] hover:bg-[#1e25ae]">
              <a href="/auth?mode=register">Ouvrir ma boutique</a>
            </Button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <a href="/auth?mode=register" className="inline-flex min-h-11 items-center rounded-xl bg-[#232ac3] px-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(35,42,195,0.16)] active:scale-[0.96] sm:px-4">
              <span className="hidden min-[390px]:inline">Ouvrir ma boutique</span><span className="min-[390px]:hidden">Ouvrir</span>
            </a>
            <button
              aria-controls="navigation-mobile"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              className="grid size-11 place-items-center rounded-xl border border-[#d1d5db] text-[#374151] transition-colors duration-150 hover:border-[#232ac3] hover:text-[#232ac3] focus-visible:outline-none"
              onClick={() => setMobileMenuOpen(open => !open)}
              type="button"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav id="navigation-mobile" className="border-t border-[#e5e7eb] bg-white px-4 py-4" aria-label="Navigation mobile">
            <div className="mx-auto grid max-w-md gap-1">
              {navigation.map(item => (
                <a className="rounded-xl px-4 py-3 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#eef0ff] hover:text-[#232ac3] focus-visible:outline-none" href={item.href} key={item.href} onClick={closeMobileMenu}>
                  {item.label}
                </a>
              ))}
              <a className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#c7caf6] px-4 text-sm font-bold text-[#232ac3] hover:bg-[#eef0ff] focus-visible:outline-none" href="/auth?mode=login" onClick={closeMobileMenu}>
                Se connecter
              </a>
            </div>
          </nav>
        )}
      </header>

      <main id="contenu-principal">
        <section className="bg-[#eef0ff] py-14 sm:py-20 lg:py-28">
          <div className="container grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <div className="max-w-2xl">
              <h1 className="max-w-[12ch] text-balance text-[clamp(3.05rem,6.2vw,5.5rem)] font-bold leading-[0.94] tracking-[-0.04em] text-[#111827]">
                Reprenez votre activité. Sans repartir de zéro.
              </h1>
              <p className="mt-7 max-w-[57ch] text-pretty text-lg leading-relaxed text-[#4b5563] sm:text-xl">
                Vos tableaux Excel ou Google Sheets contiennent déjà votre histoire. EASYSTOR vous aide à la reprendre, à vendre et à suivre votre boutique sans vous faire recommencer.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="min-h-12 rounded-xl bg-[#232ac3] px-6 text-base font-bold text-white shadow-[0_14px_30px_rgba(35,42,195,0.22)] hover:bg-[#1e25ae]">
                  <a href="/auth?mode=register">Ouvrir ma boutique <ArrowRight className="size-4" aria-hidden="true" /></a>
                </Button>
                <a className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-[#232ac3] underline-offset-4 transition-colors hover:text-[#1e25ae] hover:underline focus-visible:outline-none" href="#migrer">
                  Voir l’application <ChevronRight className="size-4" aria-hidden="true" />
                </a>
              </div>
              <p className="mt-5 max-w-[54ch] text-sm leading-relaxed text-[#374151]">
                Gratuit aujourd’hui. Sans carte bancaire. Vos données restent à vous.
              </p>
            </div>
            <HeroMotion>
              <ProductProof />
            </HeroMotion>
          </div>
        </section>

        <section className="border-y border-[#e5e7eb] bg-white py-5" aria-label="Les engagements EASYSTOR">
          <div className="container grid gap-x-8 gap-y-3 text-sm font-semibold text-[#374151] sm:grid-cols-2 xl:grid-cols-4">
            {proofPoints.map(point => <p className="flex items-start gap-2" key={point}><Check className="mt-0.5 size-4 shrink-0 text-[#059669]" aria-hidden="true" />{point}</p>)}
          </div>
        </section>

        <section id="migrer" className="scroll-mt-8 bg-[#f7f7f8] py-20 sm:py-28">
          <div className="container grid gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-16">
            <div className="max-w-xl">
              <FileSpreadsheet className="size-7 text-[#232ac3]" aria-hidden="true" />
              <h2 className="mt-5 max-w-[13ch] text-balance text-4xl font-bold leading-[1.02] tracking-[-0.035em] text-[#111827] sm:text-5xl">Vos tableaux ne restent pas derrière.</h2>
              <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-[#4b5563]">
                Nous ne vous demandons pas de tout ressaisir. Importez un fichier CSV ou XLSX ; EASYSTOR repère vos produits, clients, fournisseurs, ventes, achats et dates.
              </p>
              <ol className="mt-7 grid gap-3 text-sm leading-relaxed text-[#374151]">
                <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#232ac3] text-xs font-bold text-white">1</span><span><strong>Importer un fichier</strong> depuis Excel ou Google Sheets.</span></li>
                <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#232ac3] text-xs font-bold text-white">2</span><span><strong>Vérifier avant d’ajouter</strong> ce qui a été reconnu.</span></li>
                <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#232ac3] text-xs font-bold text-white">3</span><span><strong>Exporter quand vous le voulez</strong> dans un fichier global compatible avec Google Sheets.</span></li>
              </ol>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                <a className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#232ac3] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(35,42,195,0.16)] transition-colors hover:bg-[#1e25ae] focus-visible:outline-none" href="/auth?mode=register">Importer mon activité <ArrowRight className="size-4" aria-hidden="true" /></a>
                <a className="inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-bold text-[#232ac3] underline-offset-4 hover:underline focus-visible:outline-none" href="/guides/migrer-excel-google-sheets">Lire le guide de migration <ArrowRight className="size-4" aria-hidden="true" /></a>
              </div>
            </div>
            <MigrationPreview />
          </div>
        </section>

        <section id="vendre" className="scroll-mt-8 bg-white py-20 sm:py-28">
          <div className="container">
            <div className="max-w-2xl">
              <h2 className="max-w-[16ch] text-balance text-4xl font-bold leading-[1.02] tracking-[-0.035em] text-[#111827] sm:text-5xl">Encaissez sans perdre le rythme.</h2>
              <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-[#4b5563]">La caisse reste simple pendant le coup de feu, pendant que les informations utiles se rangent au bon endroit.</p>
            </div>

            <div className="mt-14 space-y-18 sm:mt-18">
              <article className="grid items-center gap-8 border-t border-[#e5e7eb] pt-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
                <div>
                  <span className="grid size-11 place-items-center rounded-xl bg-[#eef0ff] text-[#232ac3]"><ScanBarcode className="size-5" aria-hidden="true" /></span>
                  <h3 className="mt-5 text-3xl font-bold tracking-[-0.03em] text-[#111827]">Vendez sans chercher longtemps</h3>
                  <ul className="mt-4 grid gap-2 text-sm leading-relaxed text-[#4b5563]"><li>Recherchez un article, scannez un code-barres ou saisissez-le.</li><li>Le panier reste lisible avant de confirmer le paiement.</li><li>Le reçu peut être gardé ou partagé après l’encaissement.</li></ul>
                  <a className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-[#232ac3] underline-offset-4 hover:underline focus-visible:outline-none" href="/auth?mode=register">Ouvrir ma boutique <ArrowRight className="size-4" aria-hidden="true" /></a>
                </div>
                <CheckoutPreview />
              </article>

              <article className="grid items-center gap-8 border-t border-[#e5e7eb] pt-8 lg:grid-cols-[1.22fr_0.78fr] lg:gap-16">
                <StockPreview />
                <div className="lg:pl-4">
                  <span className="grid size-11 place-items-center rounded-xl bg-[#ecfdf5] text-[#047857]"><PackageCheck className="size-5" aria-hidden="true" /></span>
                  <h3 className="mt-5 text-3xl font-bold tracking-[-0.03em] text-[#111827]">Voyez le stock au moment d’agir</h3>
                  <ul className="mt-4 grid gap-2 text-sm leading-relaxed text-[#4b5563]"><li>Les articles, variantes et mouvements restent réunis.</li><li>Les quantités faibles apparaissent avant la rupture.</li><li>Les réapprovisionnements gardent une trace nette.</li></ul>
                  <a className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-[#232ac3] underline-offset-4 hover:underline focus-visible:outline-none" href="/auth?mode=register">Gérer mon stock <ArrowRight className="size-4" aria-hidden="true" /></a>
                </div>
              </article>

              <article id="suivre" className="scroll-mt-8 grid items-center gap-8 border-t border-[#e5e7eb] pt-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
                <div>
                  <span className="grid size-11 place-items-center rounded-xl bg-[#fff7ed] text-[#c2410c]"><BarChart3 className="size-5" aria-hidden="true" /></span>
                  <h3 className="mt-5 text-3xl font-bold tracking-[-0.03em] text-[#111827]">Préparez demain à la fermeture</h3>
                  <ul className="mt-4 grid gap-2 text-sm leading-relaxed text-[#4b5563]"><li>Ventes, dépenses et créances restent faciles à retrouver.</li><li>La clôture résume la journée sans refaire les calculs.</li><li>Les vues du jour et de la semaine montrent l’évolution.</li></ul>
                  <a className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-[#232ac3] underline-offset-4 hover:underline focus-visible:outline-none" href="/auth?mode=login">Accéder à ma boutique <ArrowRight className="size-4" aria-hidden="true" /></a>
                </div>
                <ActivityPreview />
              </article>
            </div>
          </div>
        </section>

        <section id="hors-ligne" className="scroll-mt-8 bg-[#111827] py-20 text-white sm:py-28">
          <div className="container grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
            <div className="max-w-xl">
              <CloudOff className="size-7 text-[#86efac]" aria-hidden="true" />
              <h2 className="mt-5 max-w-[15ch] text-balance text-4xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-5xl">Le travail ne s’arrête pas à une coupure.</h2>
              <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-[#d1d5db]">Quand la connexion devient instable, vous gardez une vue sur ce qui est enregistré, ce qui attend et ce qui est prêt à repartir lorsque le réseau revient.</p>
              <a className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-bold text-[#bbf7d0] underline-offset-4 hover:underline focus-visible:outline-none" href="/guides/travailler-hors-connexion">Lire le guide hors connexion <ArrowRight className="size-4" aria-hidden="true" /></a>
            </div>
            <OfflinePreview />
          </div>
        </section>

        <section id="tarifs" className="scroll-mt-8 bg-[#f7f7f8] py-20 sm:py-28" aria-labelledby="titre-tarifs">
          <div className="container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
            <div>
              <h2 id="titre-tarifs" className="max-w-[14ch] text-balance text-4xl font-bold leading-[1.02] tracking-[-0.035em] text-[#111827] sm:text-5xl">Tarifs simples. Départ gratuit.</h2>
            </div>
            <div className="border-l border-[#c7caf6] pl-6 sm:pl-8">
              <p className="text-xl font-bold tracking-[-0.02em] text-[#232ac3]">Gratuit aujourd’hui.</p>
              <p className="mt-4 max-w-[55ch] text-lg leading-relaxed text-[#4b5563]">Commencez avec toutes les fonctionnalités actuellement disponibles, sans carte bancaire ni paiement requis.</p>
              <p className="mt-4 max-w-[55ch] leading-relaxed text-[#4b5563]">Des tarifs pourront être proposés à l’avenir. Ils seront annoncés clairement avant tout changement, et aucune action de votre part n’est nécessaire pour profiter de l’accès actuel.</p>
            </div>
          </div>
        </section>

        <section className="border-y border-[#e5e7eb] bg-white py-20 sm:py-28" aria-labelledby="questions-easystor" data-seo-section="questions-easystor">
          <div className="container grid gap-10 lg:grid-cols-[0.76fr_1.24fr] lg:gap-16">
            <div className="max-w-xl">
              <h2 id="questions-easystor" className="max-w-[14ch] text-balance text-4xl font-bold leading-[1.02] tracking-[-0.035em] text-[#111827] sm:text-5xl">Les réponses utiles pour votre commerce.</h2>
              <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-[#4b5563]">Les points essentiels avant de commencer avec vos tableaux, votre caisse et une connexion qui n’est pas toujours stable.</p>
            </div>
            <div className="divide-y divide-[#e5e7eb] border-y border-[#e5e7eb]">
              {frequentlyAskedQuestions.map(({ question, answer }) => (
                <details className="group py-1" key={question}>
                  <summary className="flex min-h-15 cursor-pointer list-none items-center justify-between gap-6 py-4 text-left text-base font-bold text-[#111827] marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#232ac3]">
                    {question}
                    <span className="grid size-7 shrink-0 place-items-center rounded-full border border-[#c7caf6] text-lg font-normal text-[#232ac3] transition-transform duration-150 ease-out group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true">+</span>
                  </summary>
                  <p className="max-w-[64ch] pb-5 pr-11 leading-relaxed text-[#4b5563]">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7f7f8] py-20 sm:py-28">
          <div className="container">
            <div className="bg-[#232ac3] px-6 py-12 text-white shadow-[0_20px_50px_rgba(35,42,195,0.22)] sm:px-10 sm:py-16 lg:px-16">
              <div className="max-w-2xl">
                <h2 className="max-w-[17ch] text-balance text-4xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-5xl">Votre prochaine vente peut commencer ici.</h2>
                <p className="mt-5 max-w-[55ch] text-lg leading-relaxed text-[#e0e7ff]">Créez votre boutique, vérifiez votre e-mail, ajoutez votre premier article puis encaissez votre première vente.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="min-h-12 rounded-xl bg-white px-6 text-base font-bold text-[#232ac3] hover:bg-[#eef0ff]"><a href="/auth?mode=register">Ouvrir ma boutique <ArrowRight className="size-4" aria-hidden="true" /></a></Button>
                  <Button asChild variant="outline" size="lg" className="min-h-12 rounded-xl border-white/60 px-6 text-base font-bold text-white hover:bg-white/10 hover:text-white"><a href="/auth?mode=login">J’ai déjà un compte</a></Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e5e7eb] bg-white text-[#4b5563]">
        <div className="container grid gap-7 py-8 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-xl font-extrabold tracking-[-0.03em] text-[#111827]">EASYSTOR</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed">La caisse, le stock et le suivi pour les commerces de proximité.</p>
          </div>
          <nav aria-label="Liens de fin de page" className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-[#232ac3]">
            <a className="underline-offset-4 hover:underline" href="/guides">Guides pratiques</a>
            <a className="underline-offset-4 hover:underline" href="/guides/migrer-excel-google-sheets">Guide migration</a>
            <a className="underline-offset-4 hover:underline" href="#tarifs">Tarifs</a>
            <a className="underline-offset-4 hover:underline" href="/guides/travailler-hors-connexion">Guide hors connexion</a>
          </nav>
        </div>
        <div className="border-t border-[#e5e7eb]"><div className="container flex flex-col gap-3 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm"><p>© {new Date().getFullYear()} EASYSTOR. Tous droits réservés.</p><p>Besoin d’aide ? <a className="font-semibold text-[#232ac3] underline-offset-4 hover:underline" href="/auth?mode=login">Connectez-vous pour écrire au support</a>.</p></div></div>
      </footer>
    </div>
  );
}

function ProductProof() {
  return <div className="relative mx-auto w-full max-w-xl"><div className="absolute -left-5 top-14 hidden w-44 border border-[#c7caf6] bg-white p-4 text-[#111827] shadow-[0_16px_34px_rgba(35,42,195,0.14)] sm:block"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#232ac3]">Stock</p><p className="mt-2 text-3xl font-bold tabular-nums">18</p><p className="mt-1 text-xs leading-relaxed text-[#4b5563]">sachets disponibles</p></div><div className="overflow-hidden border border-[#dbe0ff] bg-white p-3 text-[#111827] shadow-[0_24px_60px_rgba(35,42,195,0.18)] sm:p-4"><div className="flex items-center justify-between border-b border-[#e5e7eb] px-2 pb-3 text-xs font-bold uppercase tracking-[0.11em] text-[#4b5563]"><span>Caisse</span><span className="inline-flex items-center gap-1 text-[#047857]"><CircleCheck className="size-3.5" aria-hidden="true" /> Prête</span></div><div className="grid gap-4 p-2 pt-4 sm:grid-cols-[1.05fr_0.95fr]"><div><p className="text-sm font-bold">Panier en cours</p><div className="mt-3 space-y-2"><PreviewRow name="Pain de mie" price="1 300 FCFA" /><PreviewRow name="Lait concentré" price="900 FCFA" /><PreviewRow name="Savon doux" price="700 FCFA" /></div></div><div className="bg-[#eef0ff] p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#4b5563]">À payer</p><p className="mt-2 text-3xl font-bold tracking-[-0.03em] tabular-nums">2 900 FCFA</p><div className="mt-5 flex items-center gap-2 bg-[#232ac3] px-3 py-2.5 text-sm font-bold text-white"><CreditCard className="size-4" aria-hidden="true" /> Paiement en espèces</div></div></div></div><p className="mt-4 text-right text-xs font-medium text-[#4b5563]">Aperçu illustratif de l’interface.</p></div>;
}

function PreviewRow({ name, price }: { name: string; price: string }) {
  return <div className="flex items-center justify-between gap-3 border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm"><span className="font-medium">{name}</span><span className="shrink-0 font-semibold tabular-nums text-[#232ac3]">{price}</span></div>;
}

function MigrationPreview() {
  return <div className="overflow-hidden border border-[#dbe0ff] bg-white shadow-[0_18px_42px_rgba(35,42,195,0.10)]"><div className="flex items-center justify-between gap-4 border-b border-[#e5e7eb] px-5 py-4 sm:px-7"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#232ac3]">Reprise de données</p><h3 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-[#111827]">Votre activité, prête à continuer.</h3></div><FileSpreadsheet className="size-6 text-[#232ac3]" aria-hidden="true" /></div><ol className="divide-y divide-[#e5e7eb] px-5 sm:px-7"><MigrationStep icon={Upload} title="Importer un fichier" detail="CSV ou XLSX depuis Excel ou Google Sheets" /><MigrationStep icon={ReceiptText} title="Vérifier avant d’ajouter" detail="Les feuilles reconnues et les données à reprendre sont visibles" /><MigrationStep icon={Download} title="Exporter quand vous le souhaitez" detail="Un fichier global compatible avec Google Sheets" /></ol><p className="px-5 py-3 text-xs font-medium text-[#4b5563] sm:px-7">Aperçu illustratif du parcours de migration.</p></div>;
}

function MigrationStep({ icon: Icon, title, detail }: { icon: typeof Upload; title: string; detail: string }) {
  return <li className="flex items-start gap-4 py-5"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eef0ff] text-[#232ac3]"><Icon className="size-4" aria-hidden="true" /></span><div><p className="font-semibold text-[#111827]">{title}</p><p className="mt-1 text-sm leading-relaxed text-[#4b5563]">{detail}</p></div></li>;
}

function CheckoutPreview() {
  return <div className="bg-[#111827] p-5 text-white shadow-[0_16px_42px_rgba(17,24,39,0.16)] sm:p-7"><div className="flex items-center justify-between"><span className="text-2xl font-bold tracking-[-0.03em]">Caisse rapide</span><span className="bg-[#dcfce7] px-3 py-1 text-xs font-bold text-[#166534]">Panier prêt</span></div><div className="mt-6 grid gap-3 sm:grid-cols-3">{[{ icon: ScanBarcode, title: "Scanner", text: "Ajouter sans chercher" }, { icon: CreditCard, title: "Encaisser", text: "Choisir le paiement" }, { icon: ReceiptText, title: "Partager", text: "Garder le reçu" }].map(({ icon: Icon, title, text }) => <div className="border-t border-white/20 pt-4" key={title}><Icon className="size-5 text-[#a5b4fc]" aria-hidden="true" /><p className="mt-4 font-bold">{title}</p><p className="mt-1 text-sm leading-relaxed text-[#d1d5db]">{text}</p></div>)}</div></div>;
}

function StockPreview() {
  return <div className="border border-[#d1fae5] bg-[#ecfdf5] p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#047857]">Articles de la boutique</p><h4 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-[#111827]">Stock à suivre</h4></div><PackageCheck className="size-7 text-[#047857]" aria-hidden="true" /></div><div className="mt-6 grid gap-3"><StockLine product="Jus orange" detail="24 en stock" tone="ok" /><StockLine product="Riz parfumé" detail="À réapprovisionner" tone="alert" /><StockLine product="Savon doux" detail="3 variantes" tone="neutral" /></div><p className="mt-4 text-xs font-medium text-[#4b5563]">Aperçu illustratif de l’interface.</p></div>;
}

function StockLine({ product, detail, tone }: { product: string; detail: string; tone: "ok" | "alert" | "neutral" }) {
  const dotClass = tone === "ok" ? "bg-[#059669]" : tone === "alert" ? "bg-[#d97706]" : "bg-[#6b7280]";
  return <div className="flex items-center justify-between gap-3 border border-[#d1fae5] bg-white px-4 py-3 text-sm"><span className="font-semibold text-[#111827]">{product}</span><span className="inline-flex items-center gap-2 text-right font-medium text-[#4b5563]"><span className={`size-2 rounded-full ${dotClass}`} aria-hidden="true" />{detail}</span></div>;
}

function ActivityPreview() {
  return <div className="overflow-hidden border border-[#dbe0ff] bg-white shadow-[0_14px_32px_rgba(35,42,195,0.09)]"><div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#232ac3]">Vue du jour</p><h4 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-[#111827]">Activité de la boutique</h4></div><BarChart3 className="size-6 text-[#232ac3]" aria-hidden="true" /></div><div className="grid divide-y divide-[#e5e7eb] sm:grid-cols-3 sm:divide-x sm:divide-y-0"><Metric label="Ventes" value="Aujourd’hui" /><Metric label="Créances" value="À suivre" /><Metric label="Clôture" value="À préparer" /></div><p className="px-5 py-3 text-xs font-medium text-[#4b5563]">Aperçu illustratif de l’interface.</p></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="px-5 py-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#4b5563]">{label}</p><p className="mt-2 text-sm font-semibold text-[#111827]">{value}</p></div>;
}

function OfflinePreview() {
  return <div className="overflow-hidden border border-white/15 bg-[#172033] shadow-[0_18px_48px_rgba(4,12,8,0.24)]"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#dcfce7] text-[#166534]"><CloudOff className="size-4" aria-hidden="true" /></span><div><p className="font-bold">Opérations de la boutique</p><p className="text-xs text-[#cbd5e1]">État des actions récentes</p></div></div><span className="border border-[#fbbf24]/50 px-3 py-1 text-xs font-bold text-[#fef3c7]">Hors connexion</span></div><ol className="divide-y divide-white/10 px-5 py-2"><OfflineLine title="Vente enregistrée" detail="En attente de reprise" state="waiting" /><OfflineLine title="Ajustement de stock" detail="En attente de reprise" state="waiting" /><OfflineLine title="Connexion retrouvée" detail="Prête à reprendre" state="ready" /></ol><div className="flex items-center gap-2 bg-[#111827] px-5 py-4 text-sm font-semibold text-[#e5e7eb]"><Wifi className="size-4 text-[#86efac]" aria-hidden="true" /> La file repart lorsque le réseau revient.</div><p className="px-5 py-3 text-xs font-medium text-[#cbd5e1]">Aperçu illustratif de l’interface.</p></div>;
}

function OfflineLine({ title, detail, state }: { title: string; detail: string; state: "waiting" | "ready" }) {
  return <li className="flex items-center gap-4 py-4"><span className={`size-2.5 rounded-full ${state === "ready" ? "bg-[#86efac]" : "bg-[#fbbf24]"}`} aria-hidden="true" /><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-[#cbd5e1]">{detail}</p></div></li>;
}
