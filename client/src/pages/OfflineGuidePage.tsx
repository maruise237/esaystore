import React, { useEffect } from "react";
import { ArrowLeft, ArrowRight, Check, CircleCheck, Cloud, CloudOff, FileSpreadsheet, ReceiptText, RefreshCw, ShieldCheck, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";

const guideUrl = "https://esaystor.kamtech.online/guides/travailler-hors-connexion";

const beforeYouLeave = [
  "Ouvrez EASYSTOR avec une connexion active sur l’appareil qui servira à encaisser.",
  "Vérifiez que le catalogue nécessaire à la journée est bien visible dans la caisse.",
  "Repérez le statut de synchronisation avant la coupure : à jour, en attente ou conflit.",
  "Prévoyez une connexion avant d’utiliser une devise étrangère : le taux doit être verrouillé en ligne.",
];

const workflow = [
  { title: "Repérez le mode hors ligne", text: "La caisse indique que le catalogue local est utilisé. Les opérations restent alors enregistrées sur cet appareil.", icon: CloudOff },
  { title: "Encaissez avec le catalogue disponible", text: "Recherchez, scannez ou saisissez un code-barres comme d’habitude. Le stock local est ajusté avec la vente enregistrée.", icon: ReceiptText },
  { title: "Gardez les opérations dans la file locale", text: "Les ventes, remboursements de créances, dépenses et ajustements pris en charge attendent leur synchronisation au lieu d’être perdus.", icon: ShieldCheck },
  { title: "Revenez en ligne puis contrôlez", text: "Au retour du réseau, EASYSTOR tente la synchronisation. La section Synchronisation indique ce qui est à jour, en attente ou en conflit.", icon: RefreshCw },
  { title: "Traitez une anomalie sans masquer le problème", text: "Vous pouvez réessayer une opération ou l’abandonner. Un conflit reste identifiable pour être revu avant la suite du travail.", icon: CircleCheck },
];

const questions = [
  { question: "Puis-je vendre sans réseau ?", answer: "Oui, si le catalogue local est déjà disponible sur l’appareil. La vente est conservée localement et son stock local est ajusté en attendant la synchronisation." },
  { question: "Le reçu est-il définitif hors connexion ?", answer: "Un reçu peut être créé après une vente hors connexion, mais il est signalé comme provisoire jusqu’à la synchronisation de cette vente." },
  { question: "Que dois-je faire lorsque le réseau revient ?", answer: "Ouvrez la section Synchronisation et contrôlez les opérations en attente ou les éventuels conflits. Vous pouvez lancer une nouvelle tentative quand la connexion est disponible." },
  { question: "Tout fonctionne-t-il sans connexion ?", answer: "Le mode hors connexion sert à garder l’activité opérationnelle avec les données déjà locales. Certaines actions qui exigent une donnée réseau, comme verrouiller un taux de change pour une vente en devise étrangère, nécessitent une connexion." },
];

function setMeta(selector: string, content: string) {
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (!existing) return () => undefined;
  const previous = existing.content;
  existing.content = content;
  return () => { existing.content = previous; };
}

function setCanonical(url: string) {
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const link = existing ?? document.createElement("link");
  if (!existing) { link.rel = "canonical"; document.head.appendChild(link); }
  const previous = link.href;
  link.href = url;
  return () => { if (existing) link.href = previous; else link.remove(); };
}

function useGuideMetadata() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Travailler hors connexion avec votre caisse — EASYSTOR";
    const cleanups = [
      setMeta('meta[name="description"]', "Découvrez comment utiliser EASYSTOR sans réseau : catalogue local, ventes enregistrées, opérations en attente, synchronisation et résolution des conflits."),
      setMeta('meta[property="og:title"]', "Travailler hors connexion avec votre caisse — EASYSTOR"),
      setMeta('meta[property="og:description"]', "Un guide pratique sur la caisse hors connexion, le suivi local et la synchronisation au retour du réseau."),
      setMeta('meta[property="og:url"]', guideUrl),
      setMeta('meta[name="twitter:title"]', "Travailler hors connexion avec votre caisse — EASYSTOR"),
      setMeta('meta[name="twitter:description"]', "Continuez à travailler avec le catalogue local et contrôlez la synchronisation au retour du réseau."),
      setCanonical(guideUrl),
    ];
    const schema = document.createElement("script");
    schema.id = "easystor-offline-guide-schema";
    schema.type = "application/ld+json";
    schema.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${guideUrl}#webpage`,
      url: guideUrl,
      name: "Travailler hors connexion avec votre caisse — EASYSTOR",
      inLanguage: "fr-FR",
      description: "Un guide pratique sur le travail avec une caisse hors connexion, le catalogue local et la synchronisation au retour du réseau.",
      about: { "@type": "Thing", name: "Synchronisation hors connexion d’une caisse et gestion de stock" },
      isPartOf: { "@id": "https://esaystor.kamtech.online/#website" },
    });
    document.head.appendChild(schema);
    return () => { document.title = previousTitle; cleanups.forEach(cleanup => cleanup()); schema.remove(); };
  }, []);
}

export default function OfflineGuidePage() {
  useGuideMetadata();
  return (
    <div className="min-h-screen bg-[#f7f5ee] text-[#243029]">
      <header className="border-b border-[#d6d9ce] bg-[#f7f5ee]"><div className="container flex min-h-18 items-center justify-between gap-4 py-4"><a href="/" className="inline-flex items-center gap-3 rounded-md font-serif text-2xl text-[#243029] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#567b4f]"><span className="grid size-9 place-items-center rounded-xl bg-[#d1e980] text-[#1e2924]"><BrandMark className="size-4" /></span>EASYSTOR</a><div className="flex items-center gap-2 sm:gap-4"><a href="/guides" className="rounded-md px-2 py-2 text-sm font-bold text-[#304631] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#567b4f]">Guides</a><a href="/auth?mode=login" className="rounded-md px-2 py-2 text-sm font-bold text-[#304631] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#567b4f]">Se connecter</a></div></div></header>
      <main>
        <section className="border-b border-[#294237] bg-[#1e2924] py-16 text-[#f7f5ee] sm:py-24"><div className="container max-w-5xl"><a href="/#hors-ligne" className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-bold text-[#d1e980] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d1e980]"><ArrowLeft className="size-4" aria-hidden="true" /> Travail hors connexion</a><p className="mt-9 text-sm font-bold text-[#d1e980]">Guide pratique pour commerces de proximité</p><h1 className="mt-4 max-w-4xl text-balance font-serif text-[clamp(3rem,6vw,5.6rem)] leading-[0.95] tracking-[-0.035em]">Quand le réseau ralentit, votre caisse garde le fil.</h1><p className="mt-7 max-w-3xl text-pretty text-lg leading-relaxed text-[#d5dfd3] sm:text-xl">Travaillez avec le catalogue déjà disponible sur votre appareil, conservez les opérations localement et contrôlez leur synchronisation quand la connexion revient.</p><div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg" className="h-12 rounded-lg bg-[#d1e980] px-6 text-base font-bold text-[#1e2924] hover:bg-[#e1f29b]"><a href="/auth?mode=register">Ouvrir ma boutique <ArrowRight className="size-4" aria-hidden="true" /></a></Button><a href="#avant-coupure" className="inline-flex min-h-12 items-center justify-center rounded-lg px-5 text-sm font-bold text-[#f7f5ee] underline-offset-4 hover:text-[#d1e980] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1e980]">Préparer l’appareil</a></div></div></section>

        <section className="bg-[#eeece4] py-8" aria-label="Repères de travail hors connexion"><div className="container grid gap-5 sm:grid-cols-3">{["Catalogue local disponible", "Opérations en attente visibles", "Synchronisation contrôlable"].map(item => <p className="flex items-center gap-3 text-sm font-bold text-[#304631]" key={item}><Check className="size-4 text-[#567b4f]" aria-hidden="true" />{item}</p>)}</div></section>

        <section id="avant-coupure" className="scroll-mt-8 bg-[#f7f5ee] py-20 sm:py-28"><div className="container grid gap-12 lg:grid-cols-[0.84fr_1.16fr] lg:items-start lg:gap-16"><div className="max-w-xl"><Wifi className="size-7 text-[#46684a]" aria-hidden="true" /><h2 className="mt-5 font-serif text-4xl leading-[1.02] tracking-[-0.025em] sm:text-5xl">Préparez l’appareil avant de sortir du réseau.</h2><p className="mt-6 text-lg leading-relaxed text-[#536153]">Le travail hors connexion s’appuie sur les données déjà disponibles sur l’appareil. Avant une journée à couverture instable, ouvrez votre boutique en ligne et vérifiez ce dont vous aurez besoin dans le catalogue.</p><p className="mt-5 leading-relaxed text-[#536153]">Cette préparation évite de dépendre d’un chargement qui ne peut pas arriver pendant la coupure.</p></div><aside className="rounded-2xl border border-[#d7dbd0] bg-[#fbfaf6] p-6 shadow-[0_14px_34px_rgba(45,58,45,0.08)] sm:p-8" aria-label="Checklist avant une coupure"><p className="text-sm font-bold text-[#46684a]">Avant de perdre le réseau</p><ul className="mt-5 space-y-4">{beforeYouLeave.map(item => <li className="flex items-start gap-3 leading-relaxed text-[#405140]" key={item}><CircleCheck className="mt-0.5 size-5 shrink-0 text-[#567b4f]" aria-hidden="true" />{item}</li>)}</ul></aside></div></section>

        <section className="border-y border-[#d8d8cb] bg-[#e9e6dc] py-20 sm:py-28" aria-labelledby="parcours-hors-ligne"><div className="container"><div className="max-w-2xl"><p className="text-sm font-bold text-[#46684a]">Le parcours hors connexion</p><h2 id="parcours-hors-ligne" className="mt-4 font-serif text-4xl leading-[1.02] tracking-[-0.025em] sm:text-5xl">Cinq repères pour continuer sans deviner.</h2></div><ol className="mt-12 grid gap-5 lg:grid-cols-5 lg:gap-4">{workflow.map(({ title, text, icon: Icon }, index) => <li className="rounded-2xl border border-[#d3d8cc] bg-[#f7f5ee] p-6" key={title}><div className="flex items-center justify-between"><span className="text-sm font-bold text-[#46684a]">0{index + 1}</span><Icon className="size-5 text-[#46684a]" aria-hidden="true" /></div><h3 className="mt-8 font-serif text-2xl leading-[1.05] tracking-[-0.02em] text-[#26352d]">{title}</h3><p className="mt-4 text-sm leading-relaxed text-[#536153]">{text}</p></li>)}</ol></div></section>

        <section className="bg-[#f7f5ee] py-20 sm:py-28" aria-labelledby="statut-synchronisation"><div className="container grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16"><div><p className="text-sm font-bold text-[#46684a]">Après le retour du réseau</p><h2 id="statut-synchronisation" className="mt-4 font-serif text-4xl leading-[1.02] tracking-[-0.025em] sm:text-5xl">Contrôlez ce qui attend, pas seulement la connexion.</h2><p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-[#536153]">La connexion disponible n’efface pas automatiquement les décisions à prendre. Ouvrez la section Synchronisation : elle sépare les opérations à synchroniser, les erreurs éventuelles et les conflits à résoudre.</p><p className="mt-5 max-w-[58ch] leading-relaxed text-[#536153]">Un conflit n’est pas caché : vous pouvez le repérer, le réessayer ou abandonner l’opération locale concernée selon votre décision.</p></div><div className="rounded-2xl bg-[#1e2924] p-7 text-[#f7f5ee] shadow-[0_18px_42px_rgba(30,41,36,0.18)] sm:p-9"><Cloud className="size-7 text-[#d1e980]" aria-hidden="true" /><h3 className="mt-5 font-serif text-3xl tracking-[-0.025em]">Les états à surveiller.</h3><dl className="mt-6 divide-y divide-white/15 text-sm"><div className="flex justify-between gap-5 py-3"><dt className="font-bold">Hors ligne</dt><dd className="text-right text-[#d1dcd0]">Les opérations restent sur cet appareil.</dd></div><div className="flex justify-between gap-5 py-3"><dt className="font-bold">En attente</dt><dd className="text-right text-[#d1dcd0]">Une opération attend son envoi.</dd></div><div className="flex justify-between gap-5 py-3"><dt className="font-bold">Conflit</dt><dd className="text-right text-[#d1dcd0]">Une opération doit être revue.</dd></div><div className="flex justify-between gap-5 py-3"><dt className="font-bold">À jour</dt><dd className="text-right text-[#d1dcd0]">La file locale ne contient plus d’opération en attente.</dd></div></dl></div></div></section>

        <section className="border-y border-[#d8d8cb] bg-[#eeece4] py-20 sm:py-28" aria-labelledby="questions-hors-ligne"><div className="container grid gap-10 lg:grid-cols-[0.76fr_1.24fr] lg:gap-16"><div className="max-w-xl"><p className="text-sm font-bold text-[#46684a]">Questions fréquentes</p><h2 id="questions-hors-ligne" className="mt-4 font-serif text-4xl leading-[1.02] tracking-[-0.025em] sm:text-5xl">Avancer sans prendre de risque inutile.</h2></div><div className="divide-y divide-[#ced4c8] border-y border-[#ced4c8]">{questions.map(({ question, answer }) => <details className="group py-1" key={question}><summary className="flex min-h-15 cursor-pointer list-none items-center justify-between gap-6 py-4 text-left text-base font-bold text-[#26352d] marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#567b4f]">{question}<span className="grid size-7 shrink-0 place-items-center rounded-full border border-[#b9c6b6] text-lg font-normal text-[#46684a] transition-transform duration-150 ease-out group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true">+</span></summary><p className="max-w-[64ch] pb-5 pr-11 leading-relaxed text-[#536153]">{answer}</p></details>)}</div></div></section>

        <section className="bg-[#f7f5ee] py-20 sm:py-28"><div className="container"><div className="rounded-2xl bg-[#1e2924] px-6 py-12 text-[#f7f5ee] shadow-[0_20px_55px_rgba(30,41,36,0.18)] sm:px-10 sm:py-16 lg:px-16"><div className="max-w-2xl"><h2 className="font-serif text-4xl leading-[1.02] tracking-[-0.025em] sm:text-5xl">Organisez votre boutique, même avant la prochaine coupure.</h2><p className="mt-5 text-lg leading-relaxed text-[#d5dfd3]">Créez votre boutique, vérifiez votre e-mail et préparez votre catalogue. Vous pourrez aussi importer vos tableaux existants avec notre premier guide pratique.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg" className="h-12 rounded-lg bg-[#d1e980] px-6 text-base font-bold text-[#1e2924] hover:bg-[#e1f29b]"><a href="/auth?mode=register">Créer ma boutique <ArrowRight className="size-4" aria-hidden="true" /></a></Button><a href="/guides/migrer-excel-google-sheets" className="inline-flex min-h-12 items-center justify-center rounded-lg px-5 text-sm font-bold text-[#f7f5ee] underline-offset-4 hover:text-[#d1e980] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d1e980]">Voir le guide de migration</a></div></div></div></div></section>
      </main>
      <footer className="border-t border-[#cfd3c7] bg-[#f0eee7] text-[#536153]"><div className="container flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between"><p className="font-serif text-xl text-[#26352d]">EASYSTOR</p><a className="text-sm font-bold text-[#304631] underline-offset-4 hover:underline" href="/">La caisse, le stock et le suivi pour les commerces de proximité.</a></div></footer>
    </div>
  );
}
