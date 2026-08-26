import React, { useEffect } from "react";
import { ArrowLeft, ArrowRight, BookOpenCheck, CloudOff, FileSpreadsheet, Network, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";

const hubUrl = "https://esaystor.kamtech.online/guides";

const guides = [
  {
    eyebrow: "Guide 01 · Migration de données",
    title: "Passer d’Excel ou Google Sheets à une caisse et un stock organisés.",
    description: "Préparez un fichier CSV ou XLSX, reprenez l’historique et gardez un export global de vos données.",
    href: "/guides/migrer-excel-google-sheets",
    linkLabel: "Ouvrir le guide de migration",
    icon: FileSpreadsheet,
  },
  {
    eyebrow: "Guide 02 · Travail hors connexion",
    title: "Continuer à encaisser quand le réseau ralentit.",
    description: "Préparez l’appareil, utilisez le catalogue local et contrôlez les opérations à synchroniser au retour du réseau.",
    href: "/guides/travailler-hors-connexion",
    linkLabel: "Ouvrir le guide hors connexion",
    icon: CloudOff,
  },
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

function useHubMetadata() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Guides pratiques pour votre commerce — EASYSTOR";
    const cleanups = [
      setMeta('meta[name="description"]', "Retrouvez les guides EASYSTOR pour migrer depuis Excel ou Google Sheets et travailler avec votre caisse lorsque le réseau est instable."),
      setMeta('meta[property="og:title"]', "Guides pratiques pour votre commerce — EASYSTOR"),
      setMeta('meta[property="og:description"]', "Deux guides EASYSTOR : migration de vos tableaux et travail hors connexion."),
      setMeta('meta[property="og:url"]', hubUrl),
      setMeta('meta[name="twitter:title"]', "Guides pratiques pour votre commerce — EASYSTOR"),
      setMeta('meta[name="twitter:description"]', "Des repères pratiques pour préparer vos données et continuer l’activité malgré un réseau instable."),
      setCanonical(hubUrl),
    ];
    const schema = document.createElement("script");
    schema.id = "easystor-guides-hub-schema";
    schema.type = "application/ld+json";
    schema.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${hubUrl}#webpage`,
      url: hubUrl,
      name: "Guides pratiques pour votre commerce — EASYSTOR",
      inLanguage: "fr-FR",
      description: "La collection de guides pratiques EASYSTOR sur la migration de données et le travail hors connexion.",
      isPartOf: { "@id": "https://esaystor.kamtech.online/#website" },
    });
    document.head.appendChild(schema);
    return () => { document.title = previousTitle; cleanups.forEach(cleanup => cleanup()); schema.remove(); };
  }, []);
}

export default function GuidesHubPage() {
  useHubMetadata();
  return (
    <div className="min-h-screen bg-[#f7f5ee] text-[#243029]">
      <header className="border-b border-[#d6d9ce] bg-[#f7f5ee]"><div className="container flex min-h-18 items-center justify-between gap-4 py-4"><a href="/" className="inline-flex items-center gap-3 rounded-md font-serif text-2xl text-[#243029] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#567b4f]"><span className="grid size-9 place-items-center rounded-xl bg-[#d1e980] text-[#1e2924]"><BrandMark className="size-4" /></span>EASYSTOR</a><div className="flex items-center gap-2 sm:gap-4"><a href="/" className="rounded-md px-2 py-2 text-sm font-bold text-[#304631] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#567b4f]">Accueil</a><a href="/auth?mode=login" className="rounded-md px-2 py-2 text-sm font-bold text-[#304631] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#567b4f]">Se connecter</a></div></div></header>
      <main>
        <section className="border-b border-[#294237] bg-[#1e2924] py-16 text-[#f7f5ee] sm:py-24"><div className="container max-w-5xl"><a href="/" className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-bold text-[#d1e980] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d1e980]"><ArrowLeft className="size-4" aria-hidden="true" /> Retour à l’accueil</a><p className="mt-9 text-sm font-bold text-[#d1e980]">Ressources EASYSTOR</p><h1 className="mt-4 max-w-4xl text-balance font-serif text-[clamp(3rem,6vw,5.6rem)] leading-[0.95] tracking-[-0.035em]">Les guides pratiques pour tenir votre commerce.</h1><p className="mt-7 max-w-3xl text-pretty text-lg leading-relaxed text-[#d5dfd3] sm:text-xl">Deux ressources simples pour préparer vos données existantes et continuer à travailler lorsque la connexion devient instable.</p></div></section>
        <section className="bg-[#f7f5ee] py-20 sm:py-28"><div className="container"><div className="grid gap-7 lg:grid-cols-2">{guides.map(({ eyebrow, title, description, href, linkLabel, icon: Icon }, index) => <article className={`flex min-h-full flex-col rounded-2xl border p-7 shadow-[0_16px_40px_rgba(43,55,43,0.1)] sm:p-9 ${index === 0 ? "border-[#d7dbd0] bg-[#fbfaf6]" : "border-[#2d4939] bg-[#203028] text-[#f7f5ee]"}`} key={href}><div className={`grid size-12 place-items-center rounded-xl ${index === 0 ? "bg-[#e6edd0] text-[#35513a]" : "bg-[#d1e980] text-[#1e2924]"}`}><Icon className="size-6" aria-hidden="true" /></div><p className={`mt-8 text-sm font-bold ${index === 0 ? "text-[#46684a]" : "text-[#d1e980]"}`}>{eyebrow}</p><h2 className="mt-4 font-serif text-4xl leading-[1.03] tracking-[-0.025em]">{title}</h2><p className={`mt-5 max-w-[54ch] text-lg leading-relaxed ${index === 0 ? "text-[#536153]" : "text-[#d1dcd0]"}`}>{description}</p><a href={href} className={`mt-auto inline-flex min-h-12 items-center gap-2 pt-8 text-sm font-bold underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${index === 0 ? "text-[#304631] focus-visible:outline-[#567b4f]" : "text-[#d1e980] focus-visible:outline-[#d1e980]"}`}>{linkLabel} <ArrowRight className="size-4" aria-hidden="true" /></a></article>)}</div></div></section>
        <section className="border-y border-[#d8d8cb] bg-[#eeece4] py-16 sm:py-20"><div className="container grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center"><div><Network className="size-7 text-[#46684a]" aria-hidden="true" /><h2 className="mt-5 font-serif text-4xl leading-[1.02] tracking-[-0.025em]">Chaque guide vous ramène à la bonne étape.</h2><p className="mt-5 max-w-[58ch] text-lg leading-relaxed text-[#536153]">Les ressources renvoient vers l’accueil, vers leur guide associé et vers l’inscription lorsque vous êtes prêt à démarrer. Vous ne restez pas bloqué à la fin d’une page.</p></div><div className="rounded-2xl border border-[#d5dacd] bg-[#f7f5ee] p-7"><ShieldCheck className="size-6 text-[#46684a]" aria-hidden="true" /><p className="mt-5 font-serif text-2xl text-[#26352d]">Vous cherchez une réponse avant d’ouvrir la boutique ?</p><p className="mt-3 leading-relaxed text-[#536153]">Commencez par le guide qui correspond à votre situation, puis rejoignez l’inscription lorsque vous avez vos informations sous la main.</p><Button asChild className="mt-6 h-11 rounded-lg bg-[#d1e980] px-5 font-bold text-[#1e2924] hover:bg-[#e1f29b]"><a href="/auth?mode=register">Créer ma boutique <ArrowRight className="size-4" aria-hidden="true" /></a></Button></div></div></section>
      </main>
      <footer className="border-t border-[#cfd3c7] bg-[#f0eee7] text-[#536153]"><div className="container flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between"><p className="font-serif text-xl text-[#26352d]">EASYSTOR</p><a className="text-sm font-bold text-[#304631] underline-offset-4 hover:underline" href="/">La caisse, le stock et le suivi pour les commerces de proximité.</a></div></footer>
    </div>
  );
}
