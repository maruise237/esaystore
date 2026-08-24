import { useState } from "react";
import { ArrowRight, Check, Loader2, LockKeyhole, ShoppingBag, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [error, setError] = useState<string | null>(null);
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "", shopName: "", currency: "XAF" as "XAF" | "XOF" | "NGN", country: "CMR" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const register = trpc.auth.register.useMutation({ onSuccess: () => window.location.reload(), onError: (cause) => setError(cause.message) });
  const login = trpc.auth.login.useMutation({ onSuccess: () => window.location.reload(), onError: (cause) => setError(cause.message) });
  const pending = register.isPending || login.isPending;

  return (
    <main className="grid min-h-screen bg-[#f7f5ee] lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-[#1e2924] p-14 text-[#f7f5ee] lg:flex lg:flex-col">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#d1e980]/10 blur-3xl" />
        <div className="relative flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#d1e980] text-[#1e2924]"><ShoppingBag className="h-5 w-5" /></div><span className="font-serif text-2xl">EASYSTOR</span></div>
        <div className="relative my-auto max-w-xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-[#c4da72]">La caisse de proximité</p>
          <h1 className="font-serif text-6xl leading-[1.02] tracking-tight">Vendez vite.<br />Pilotez clair.</h1>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-[#cdd6cc]">Une caisse et un stock conçus pour les boutiques qui veulent garder le contrôle, même quand la connexion est capricieuse.</p>
          <div className="mt-11 grid gap-4 text-sm">
            {["Caisse rapide et paiements essentiels", "Stock et créances suivis au quotidien", "Installable, avec synchronisation différée"].map((item) => <div key={item} className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#d1e980] text-[#1e2924]"><Check className="h-3.5 w-3.5" /></span>{item}</div>)}
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-[#a8b7a7]"><WifiOff className="h-4 w-4" /> Pensé pour les réseaux instables.</div>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#1e2924] text-[#d1e980]"><ShoppingBag className="h-5 w-5" /></div><span className="font-serif text-2xl">EASYSTOR</span></div>
          <div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#718165]">Espace marchand</p><h2 className="mt-3 font-serif text-4xl tracking-tight">{mode === "register" ? "Ouvrez votre boutique" : "Bon retour"}</h2><p className="mt-3 text-sm leading-relaxed text-[#77776c]">{mode === "register" ? "Commencez avec votre première boutique en quelques instants." : "Connectez-vous pour reprendre la gestion de votre activité."}</p></div>
          <div className="mb-7 grid grid-cols-2 rounded-xl bg-[#eceae2] p-1"><button onClick={() => { setMode("register"); setError(null); }} className={`rounded-lg py-2 text-sm font-semibold transition ${mode === "register" ? "bg-white text-[#27332d] shadow-sm" : "text-[#77776c]"}`}>Créer un compte</button><button onClick={() => { setMode("login"); setError(null); }} className={`rounded-lg py-2 text-sm font-semibold transition ${mode === "login" ? "bg-white text-[#27332d] shadow-sm" : "text-[#77776c]"}`}>Se connecter</button></div>
          {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {mode === "register" ? (
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setError(null); register.mutate(registerForm); }}>
              <Field label="Votre nom"><Input required value={registerForm.name} onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })} placeholder="Jules Kamta" /></Field>
              <Field label="Nom de la boutique"><Input required value={registerForm.shopName} onChange={(event) => setRegisterForm({ ...registerForm, shopName: event.target.value })} placeholder="Épicerie du marché" /></Field>
              <Field label="E-mail"><Input required type="email" value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} placeholder="vous@boutique.com" /></Field>
              <Field label="Mot de passe"><Input required type="password" minLength={10} value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} placeholder="10 caractères minimum" /></Field>
              <div className="grid grid-cols-2 gap-4"><Field label="Devise"><select value={registerForm.currency} onChange={(event) => setRegisterForm({ ...registerForm, currency: event.target.value as "XAF" | "XOF" | "NGN" })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="XAF">XAF</option><option value="XOF">XOF</option><option value="NGN">NGN</option></select></Field><Field label="Pays (code ISO)"><Input required maxLength={3} value={registerForm.country} onChange={(event) => setRegisterForm({ ...registerForm, country: event.target.value.toUpperCase() })} /></Field></div>
              <Button disabled={pending} type="submit" className="mt-3 h-11 w-full bg-[#26352d] text-[#f5f7e8] hover:bg-[#1b2721]">{pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}Créer ma boutique</Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setError(null); login.mutate(loginForm); }}>
              <Field label="E-mail"><Input required type="email" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} placeholder="vous@boutique.com" /></Field>
              <Field label="Mot de passe"><Input required type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} /></Field>
              <Button disabled={pending} type="submit" className="mt-3 h-11 w-full bg-[#26352d] text-[#f5f7e8] hover:bg-[#1b2721]">{pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />}Accéder à ma boutique</Button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2"><Label className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f695c]">{label}</Label>{children}</label>; }
