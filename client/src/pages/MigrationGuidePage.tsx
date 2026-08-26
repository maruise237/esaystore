import React, { useEffect } from "react";
import { ArrowLeft, ArrowRight, Check, CircleCheck, Download, FileSpreadsheet, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";

const guideUrl = "https://esaystor.kamtech.online/guides/migrer-excel-google-sheets";

const preparationChecks = [
  "Une ligne d’en-tête claire pour identifier chaque colonne.",
  "Des produits séparés de vos ventes et de vos informations clients.",
  "Des dates et des montants cohérents avant de reprendre l’historique.",
  "Un fichier CSV ou XLSX exporté depuis Excel ou Google Sheets.",
];

const migrationSteps = [
  {
    title: "Préparez le fichier que vous utilisez déjà",
    detail: "Conservez vos colonnes utiles et exportez le tableau en CSV ou XLSX. Vous n’avez pas besoin de connecter votre compte Google pour commencer.",
    icon: FileSpreadsheet,
  },
  {
    title: "Importez puis examinez la lecture proposée",
    detail: "EASYSTOR vous aide à classer les produits, les ventes et les données historiques avant leur ajout dans votre espace.",
    icon: Upload,
  },
  {
    title: "Décidez les collisions avant toute écriture",
    detail: "Lorsqu’une donnée peut correspondre à un élément déjà présent, vous choisissez la décision adaptée avant que l’import ne continue.",
    icon: ShieldCheck,
  },
  {
    title: "Reprenez votre activité avec un historique plus lisible",
    detail: "Vos produits, ventes, mouvements de stock et dates importées restent organisés pour vous permettre de suivre la boutique dans la continuité.",
    icon: CircleCheck,
  },
  {
    title: "Gardez une sortie complète de vos données",
    detail: "Vous pouvez exporter l’ensemble de votre activité dans un fichier unique compatible avec Google Sheets quand vous le souhaitez.",
    icon: Download,
  },
];

const questions = [
  {
    question: "Quels fichiers puis-je utiliser pour démarrer ?",
    answer: "EASYSTOR accepte les fichiers CSV et XLSX exportés depuis Excel ou Google Sheets. Aucun accès à votre compte Google n’est nécessaire pour importer un fichier.",
  },
  {
    question: "Puis-je reprendre des ventes anciennes ?",
    answer: "Oui. Le parcours de migration est conçu pour organiser les données historiques, notamment leurs dates, avant de les ajouter à votre espace.",
  },
  {
    question: "Mes données restent-elles récupérables ?",
    answer: "Oui. L’export global permet de réunir les données de votre activité dans un fichier unique compatible avec Google Sheets.",
  },
];

function setMeta(selector: string, content: string) {
  const meta = document.head.querySelector<HTMLMetaElement>(selector);
  if (!meta) return () => undefined;
  const previousContent = meta.content;
  meta.content = content;
  return () => {
    meta.content = previousContent;
  };
}

function setCanonical(url: string) {
  const existingLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const link = existingLink ?? document.createElement("link");
  if (!existingLink) {
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  const previousHref = link.href;
  link.href = url;
  return () => {
    if (existingLink) link.href = previousHref;
    else link.remove();
  };
}

function useGuideMetadata() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Migrer d’Excel ou Google Sheets vers une caisse — EASYSTOR";

    const cleanups = [
      setMeta('meta[name="description"]', "Préparez et importez un fichier CSV ou XLSX depuis Excel ou Google Sheets vers EASYSTOR, puis gardez un export global de vos données."),
      setMeta('meta[property="og:title"]', "Migrer d’Excel ou Google Sheets vers une caisse — EASYSTOR"),
      setMeta('meta[property="og:description"]', "Un guide pratique pour préparer, importer et conserver vos données de commerce depuis Excel ou Google Sheets."),
      setMeta('meta[property="og:url"]', guideUrl),
      setMeta('meta[name="twitter:title"]', "Migrer d’Excel ou Google Sheets vers une caisse — EASYSTOR"),
      setMeta('meta[name="twitter:description"]', "Préparez, importez et gardez la main sur vos données de commerce."),
      setCanonical(guideUrl),
    ];

    const schema = document.createElement("script");
    schema.id = "easystor-migration-guide-schema";
    schema.type = "application/ld+json";
    schema.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${guideUrl}#webpage`,
      url: guideUrl,
      name: "Migrer d’Excel ou Google Sheets vers une caisse — EASYSTOR",
      inLanguage: "fr-FR",
      description: "Un guide pratique pour préparer, importer et conserver les données de commerce depuis Excel ou Google Sheets avec EASYSTOR.",
      about: {
        "@type": "Thing",
        name: "Migration de données de caisse et de stock",
      },
      isPartOf: { "@id": "https://esaystor.kamtech.online/#website" },
    });
    document.head.appendChild(schema);

    return () => {
      document.title = previousTitle;
      cleanups.forEach(cleanup => cleanup());
      schema.remove();
    };
  }, []);
}

export default function MigrationGuidePage() {
  useGuideMetadata();

  return (
    <div className="min-h-screen bg-[#f7f5ee] text-[#243029]">
      <header className="border-b border-[#d6d9ce] bg-[#f7f5ee]">
        <div className="container flex min-h-18 items-center justify-between gap-4 py-4">
          <a href="/" className="inline-flex items-center gap-3 rounded-md font-serif text-2xl text-[#243029] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#567b4f]">
            <span className="grid size-9 place-items-center rounded-xl bg-[#d1e980] text-[#1e2924]"><BrandMark className="size-4" /></span>
            EASYSTOR
          </a>
          <div className="flex items-center gap-2 sm:gap-4"><a href="/guides" className="rounded-md px-2 py-2 text-sm font-bold text-[#304631] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#567b4f]">Guides</a><a href="/auth?mode=login" className="rounded-md px-2 py-2 text-sm font-bold text-[#304631] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#567b4f]">Se connecter</a></div>
        </div>
      </header>

      <main>
        <section className="border-b border-[#294237] bg-[#1e2924] py-16 text-[#f7f5ee] sm:py-24">
          <div className="container max-w-5xl">
            <a href="/#migrer" className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-bold text-[#d1e980] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d1e980]">
              <ArrowLeft className="size-4" aria-hidden="true" /> Migration de données
            </a>
            <p className="mt-9 text-sm font-bold text-[#d1e980]">Guide pratique pour commerces de proximité</p>
            <h1 className="mt-4 max-w-4xl text-balance font-serif text-[clamp(3rem,6vw,5.6rem)] leading-[0.95] tracking-[-0.035em]">Passer d’Excel ou Google Sheets à une caisse et un stock organisés.</h1>
            <p className="mt-7 max-w-3xl text-pretty text-lg leading-relaxed text-[#d5dfd3] sm:text-xl">Préparez vos tableaux actuels, importez un fichier CSV ou XLSX, reprenez votre historique avec des décisions explicites et gardez un export global de vos données.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-lg bg-[#d1e980] px-6 text-base font-bold text-[#1e2924] hover:bg-[#e1f29b]"><a href="/auth?mode=register">Ouvrir ma boutique <ArrowRight className="size-4" aria-hidden="true" /></a></Button>
              <a href="#preparer-import" className="inline-flex min-h-12 items-center justify-center rounded-lg px-5 text-sm font-bold text-[#f7f5ee] underline-offset-4 hover:text-[#d1e980] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1e980]">Voir les étapes</a>
            </div>
          </div>
        </section>

        <section className="bg-[#eeece4] py-8" aria-label="Repères de migration">
          <div className="container grid gap-5 sm:grid-cols-3">
            {["Fichiers CSV et XLSX", "Relecture avant ajout", "Export global compatible Sheets"].map(item => <p className="flex items-center gap-3 text-sm font-bold text-[#304631]" key={item}><Check className="size-4 text-[#567b4f]" aria-hidden="true" />{item}</p>)}
          </div>
        </section>

        <section id="preparer-import" className="scroll-mt-8 bg-[#f7f5ee] py-20 sm:py-28">
          <div className="container grid gap-12 lg:grid-cols-[0.84fr_1.16fr] lg:items-start lg:gap-16">
            <div className="max-w-xl">
              <FileSpreadsheet className="size-7 text-[#46684a]" aria-hidden="true" />
              <h2 className="mt-5 font-serif text-4xl leading-[1.02] tracking-[-0.025em] sm:text-5xl">Commencez avec le fichier qui vous sert déjà.</h2>
              <p className="mt-6 text-lg leading-relaxed text-[#536153]">L’objectif n’est pas de tout refaire. Préparez votre tableau pour que les informations importantes puissent être relues clairement : produits, ventes, dates et montants.</p>
              <p className="mt-5 leading-relaxed text-[#536153]">Si certaines données sont incomplètes, commencez par les éléments qui vous permettent de reprendre l’activité au quotidien. Vous pourrez compléter le catalogue ensuite.</p>
            </div>
            <aside className="rounded-2xl border border-[#d7dbd0] bg-[#fbfaf6] p-6 shadow-[0_14px_34px_rgba(45,58,45,0.08)] sm:p-8" aria-label="Checklist de préparation">
              <p className="text-sm font-bold text-[#46684a]">Avant l’import</p>
              <ul className="mt-5 space-y-4">
                {preparationChecks.map(item => <li className="flex items-start gap-3 leading-relaxed text-[#405140]" key={item}><CircleCheck className="mt-0.5 size-5 shrink-0 text-[#567b4f]" aria-hidden="true" />{item}</li>)}
              </ul>
            </aside>
          </div>
        </section>

        <section className="border-y border-[#d8d8cb] bg-[#e9e6dc] py-20 sm:py-28" aria-labelledby="etapes-migration">
          <div className="container">
            <div className="max-w-2xl">
              <p className="text-sm font-bold text-[#46684a]">Le parcours de migration</p>
              <h2 id="etapes-migration" className="mt-4 font-serif text-4xl leading-[1.02] tracking-[-0.025em] sm:text-5xl">Cinq étapes pour reprendre sans perdre le fil.</h2>
            </div>
            <ol className="mt-12 grid gap-5 lg:grid-cols-5 lg:gap-4">
              {migrationSteps.map(({ title, detail, icon: Icon }, index) => (
                <li className="rounded-2xl border border-[#d3d8cc] bg-[#f7f5ee] p-6" key={title}>
                  <div className="flex items-center justify-between"><span className="text-sm font-bold text-[#46684a]">0{index + 1}</span><Icon className="size-5 text-[#46684a]" aria-hidden="true" /></div>
                  <h3 className="mt-8 font-serif text-2xl leading-[1.05] tracking-[-0.02em] text-[#26352d]">{title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-[#536153]">{detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-[#f7f5ee] py-20 sm:py-28" aria-labelledby="controle-donnees">
          <div className="container grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
            <div>
              <p className="text-sm font-bold text-[#46684a]">Garder le contrôle</p>
              <h2 id="controle-donnees" className="mt-4 font-serif text-4xl leading-[1.02] tracking-[-0.025em] sm:text-5xl">Vos tableaux deviennent un point de départ, pas une prison.</h2>
              <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-[#536153]">Une migration n’empêche pas de revenir à vos données. EASYSTOR garde la possibilité d’exporter l’activité dans un fichier unique compatible avec Google Sheets afin que vous puissiez consulter et archiver vos informations comme vous le souhaitez.</p>
              <a href="/guides/travailler-hors-connexion" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-bold text-[#304631] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#567b4f]">Voir aussi : travailler hors connexion <ArrowRight className="size-4" aria-hidden="true" /></a>
            </div>
            <div className="rounded-2xl bg-[#1e2924] p-7 text-[#f7f5ee] shadow-[0_18px_42px_rgba(30,41,36,0.18)] sm:p-9">
              <Download className="size-7 text-[#d1e980]" aria-hidden="true" />
              <h3 className="mt-5 font-serif text-3xl tracking-[-0.025em]">Un export global quand vous en avez besoin.</h3>
              <p className="mt-4 leading-relaxed text-[#d1dcd0]">Produits, ventes, dépenses et créances peuvent être réunis dans le même fichier exporté. Vous gardez la liberté de relire votre activité en dehors de l’application.</p>
            </div>
          </div>
        </section>

        <section className="border-y border-[#d8d8cb] bg-[#eeece4] py-20 sm:py-28" aria-labelledby="questions-guide">
          <div className="container grid gap-10 lg:grid-cols-[0.76fr_1.24fr] lg:gap-16">
            <div className="max-w-xl"><p className="text-sm font-bold text-[#46684a]">Questions fréquentes</p><h2 id="questions-guide" className="mt-4 font-serif text-4xl leading-[1.02] tracking-[-0.025em] sm:text-5xl">Préparer le passage sans deviner.</h2></div>
            <div className="divide-y divide-[#ced4c8] border-y border-[#ced4c8]">
              {questions.map(({ question, answer }) => (
                <details className="group py-1" key={question}>
                  <summary className="flex min-h-15 cursor-pointer list-none items-center justify-between gap-6 py-4 text-left text-base font-bold text-[#26352d] marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#567b4f]">
                    {question}<span className="grid size-7 shrink-0 place-items-center rounded-full border border-[#b9c6b6] text-lg font-normal text-[#46684a] transition-transform duration-150 ease-out group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true">+</span>
                  </summary>
                  <p className="max-w-[64ch] pb-5 pr-11 leading-relaxed text-[#536153]">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7f5ee] py-20 sm:py-28">
          <div className="container"><div className="rounded-2xl bg-[#1e2924] px-6 py-12 text-[#f7f5ee] shadow-[0_20px_55px_rgba(30,41,36,0.18)] sm:px-10 sm:py-16 lg:px-16"><div className="max-w-2xl"><h2 className="font-serif text-4xl leading-[1.02] tracking-[-0.025em] sm:text-5xl">Prêt à reprendre votre activité avec des données organisées ?</h2><p className="mt-5 text-lg leading-relaxed text-[#d5dfd3]">Créez votre boutique, vérifiez votre e-mail puis utilisez le parcours de migration pour examiner votre fichier avant son ajout.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg" className="h-12 rounded-lg bg-[#d1e980] px-6 text-base font-bold text-[#1e2924] hover:bg-[#e1f29b]"><a href="/auth?mode=register">Créer ma boutique <ArrowRight className="size-4" aria-hidden="true" /></a></Button><a href="/" className="inline-flex min-h-12 items-center justify-center rounded-lg px-5 text-sm font-bold text-[#f7f5ee] underline-offset-4 hover:text-[#d1e980] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1e980]">Découvrir EASYSTOR</a></div></div></div></div>
        </section>
      </main>

      <footer className="border-t border-[#cfd3c7] bg-[#f0eee7] text-[#536153]"><div className="container flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between"><p className="font-serif text-xl text-[#26352d]">EASYSTOR</p><a className="text-sm font-bold text-[#304631] underline-offset-4 hover:underline" href="/">La caisse, le stock et le suivi pour les commerces de proximité.</a></div></footer>
    </div>
  );
}
