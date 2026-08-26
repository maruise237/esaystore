import React, { useId, useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, Loader2, LockKeyhole, ShoppingBag, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { neonAuthClient } from "@/lib/neonAuth";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">(() =>
    new URLSearchParams(window.location.search).get("mode") === "login"
      ? "login"
      : "register"
  );
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [neonPending, setNeonPending] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [awaitingEmailVerification, setAwaitingEmailVerification] = useState(false);
  const passwordHintId = useId();
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "", shopName: "", currency: "XAF" as "XAF" | "XOF" | "NGN", country: "CMR" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const register = trpc.auth.register.useMutation({ onSuccess: () => window.location.reload(), onError: (cause) => setError(cause.message) });
  const login = trpc.auth.login.useMutation({ onSuccess: () => window.location.reload(), onError: (cause) => setError(cause.message) });
  const createShop = trpc.shops.create.useMutation();
  const pending = register.isPending || login.isPending || createShop.isPending || neonPending;

  const registerWithNeon = async () => {
    setError(null);
    setNeonPending(true);
    try {
      const result = await neonAuthClient.signUp.email({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
      });
      if (result.error) {
        setError("La création de compte est impossible avec ces informations.");
        return;
      }
      if (result.data?.user && !result.data.user.emailVerified) {
        setAwaitingEmailVerification(true);
        return;
      }
      await createShop.mutateAsync({
        name: registerForm.shopName,
        currency: registerForm.currency,
        country: registerForm.country,
      });
      window.location.reload();
    } catch {
      setError("Votre compte a été créé, mais la boutique doit encore être configurée après connexion.");
      window.setTimeout(() => window.location.reload(), 900);
    } finally {
      setNeonPending(false);
    }
  };

  const verifyEmailAndCreateShop = async () => {
    setError(null);
    setNeonPending(true);
    try {
      const result = await neonAuthClient.emailOtp.verifyEmail({
        email: registerForm.email,
        otp: verificationCode,
      });
      if (result.error) {
        setError("Le code est invalide ou a expiré. Vérifiez votre e-mail puis réessayez.");
        return;
      }
      await createShop.mutateAsync({
        name: registerForm.shopName,
        currency: registerForm.currency,
        country: registerForm.country,
      });
      window.location.reload();
    } catch {
      setError("La vérification ne peut pas être finalisée pour le moment.");
    } finally {
      setNeonPending(false);
    }
  };

  const loginWithNeon = async () => {
    setError(null);
    setNeonPending(true);
    try {
      const result = await neonAuthClient.signIn.email(loginForm);
      if (!result.error) {
        window.location.reload();
        return;
      }
      login.mutate(loginForm);
    } catch {
      login.mutate(loginForm);
    } finally {
      setNeonPending(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-[#f7f5ee] lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-[#1e2924] p-14 text-[#f7f5ee] lg:flex lg:flex-col">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-[#d1e980]/10 blur-3xl" />
        <div className="relative flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#d1e980] text-[#1e2924]"><BrandMark className="h-5 w-5" /></div><span className="font-serif text-2xl">EASYSTOR</span></div>
        <div className="relative my-auto max-w-xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-[#c4da72]">La caisse de proximité</p>
          <h1 className="font-serif text-6xl leading-[1.02] tracking-tight">Vendez vite.<br />Pilotez clair.</h1>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-[#cdd6cc]">Une caisse et un stock conçus pour les boutiques qui veulent garder le contrôle, même quand la connexion est capricieuse.</p>
          <div className="mt-9 flex max-w-md items-center gap-3 border-y border-white/10 py-4 text-sm">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#d1e980]/25 bg-[#d1e980]/10 text-[#d1e980]">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <p className="leading-snug text-[#dbe4d9]">
              Chaque vente garde son reçu, son stock et son paiement alignés.
              <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#b7ce69]">Même hors connexion</span>
            </p>
          </div>
          <div className="mt-11 grid gap-4 text-sm">
            {["Caisse rapide et paiements essentiels", "Stock et créances suivis au quotidien", "Installable, avec synchronisation différée"].map((item) => <div key={item} className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#d1e980] text-[#1e2924]"><Check className="h-3.5 w-3.5" /></span>{item}</div>)}
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-[#a8b7a7]"><WifiOff className="h-4 w-4" /> Pensé pour les réseaux instables.</div>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#1e2924] text-[#d1e980]"><BrandMark className="h-5 w-5" /></div><span className="font-serif text-2xl">EASYSTOR</span></div>
          <div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#718165]">Espace marchand</p><h2 className="mt-3 font-serif text-4xl tracking-tight">{mode === "register" ? "Ouvrez votre boutique" : "Bon retour"}</h2><p className="mt-3 text-sm leading-relaxed text-[#77776c]">{mode === "register" ? "Créez votre espace, ajoutez un article, puis réalisez votre première vente." : "Connectez-vous pour reprendre la gestion de votre activité."}</p>{mode === "register" && <ol className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-l border-[#c4da72] pl-3 text-xs font-medium text-[#536153]"><li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#567b4f]" />1. Boutique</li><li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#567b4f]" />2. Produit</li><li className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#567b4f]" />3. Vente</li></ol>}</div>
          <div className="mb-7 grid grid-cols-2 rounded-xl bg-[#eceae2] p-1" role="tablist" aria-label="Accès à EASYSTOR"><button type="button" role="tab" aria-selected={mode === "register"} onClick={() => { setMode("register"); setError(null); setShowPassword(false); }} className={`rounded-lg py-2 text-sm font-semibold transition ${mode === "register" ? "bg-white text-[#27332d] shadow-sm" : "text-[#77776c]"}`}>Créer un compte</button><button type="button" role="tab" aria-selected={mode === "login"} onClick={() => { setMode("login"); setError(null); setShowPassword(false); }} className={`rounded-lg py-2 text-sm font-semibold transition ${mode === "login" ? "bg-white text-[#27332d] shadow-sm" : "text-[#77776c]"}`}>Se connecter</button></div>
          {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
          {awaitingEmailVerification ? (
            <form className="space-y-4" onSubmit={event => { event.preventDefault(); void verifyEmailAndCreateShop(); }}>
              <div className="rounded-xl border border-[#cbd8a5] bg-[#f1f6e4] p-4 text-sm text-[#3c513a]" role="status">Un code de vérification a été envoyé à <strong>{registerForm.email}</strong>. Saisissez-le pour créer votre boutique.</div>
              <Field label="Code de vérification" inputId="email-verification-code"><Input id="email-verification-code" required autoComplete="one-time-code" inputMode="numeric" value={verificationCode} onChange={event => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="Code reçu par e-mail" /></Field>
              <Button disabled={pending || verificationCode.length < 4} type="submit" className="h-11 w-full bg-[#26352d] text-[#f5f7e8] hover:bg-[#1b2721]">{pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Vérification…</> : "Vérifier et créer ma boutique"}</Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => { setAwaitingEmailVerification(false); setVerificationCode(""); }}>Modifier mes informations</Button>
            </form>
          ) : mode === "register" ? (
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void registerWithNeon(); }}>
              <Field label="Votre nom" inputId="register-name"><Input id="register-name" required autoComplete="name" value={registerForm.name} onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })} placeholder="Jules Kamta" /></Field>
              <Field label="Nom de la boutique" inputId="register-shop"><Input id="register-shop" required autoComplete="organization" value={registerForm.shopName} onChange={(event) => setRegisterForm({ ...registerForm, shopName: event.target.value })} placeholder="Épicerie du marché" /></Field>
              <Field label="E-mail" inputId="register-email"><Input id="register-email" required autoComplete="email" type="email" value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} placeholder="vous@boutique.com" /></Field>
              <Field label="Mot de passe" inputId="register-password"><PasswordInput id="register-password" value={registerForm.password} onChange={(value) => setRegisterForm({ ...registerForm, password: value })} visible={showPassword} onVisibilityChange={setShowPassword} autoComplete="new-password" ariaDescribedBy={passwordHintId} /><p id={passwordHintId} className="text-xs leading-relaxed text-[#697466]">10 caractères minimum. Vous pourrez l’utiliser sur tous vos appareils.</p></Field>
              <div className="grid grid-cols-2 gap-4"><Field label="Devise" inputId="register-currency"><select id="register-currency" value={registerForm.currency} onChange={(event) => setRegisterForm({ ...registerForm, currency: event.target.value as "XAF" | "XOF" | "NGN" })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="XAF">XAF</option><option value="XOF">XOF</option><option value="NGN">NGN</option></select></Field><Field label="Pays (code ISO)" inputId="register-country"><Input id="register-country" required autoComplete="country" maxLength={3} value={registerForm.country} onChange={(event) => setRegisterForm({ ...registerForm, country: event.target.value.toUpperCase() })} /></Field></div>
              <Button disabled={pending} type="submit" className="mt-3 h-11 w-full bg-[#26352d] text-[#f5f7e8] shadow-[0_10px_22px_rgba(30,41,36,0.18)] hover:bg-[#1b2721]" aria-live="polite">{pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création en cours…</> : <><ArrowRight className="mr-2 h-4 w-4" />Créer ma boutique</>}</Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void loginWithNeon(); }}>
              <Field label="E-mail" inputId="login-email"><Input id="login-email" required autoComplete="email" type="email" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} placeholder="vous@boutique.com" /></Field>
              <Field label="Mot de passe" inputId="login-password"><PasswordInput id="login-password" value={loginForm.password} onChange={(value) => setLoginForm({ ...loginForm, password: value })} visible={showPassword} onVisibilityChange={setShowPassword} autoComplete="current-password" /></Field>
              <Button disabled={pending} type="submit" className="mt-3 h-11 w-full bg-[#26352d] text-[#f5f7e8] hover:bg-[#1b2721]" aria-live="polite">{pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connexion en cours…</> : <><LockKeyhole className="mr-2 h-4 w-4" />Accéder à ma boutique</>}</Button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function Field({ label, inputId, children }: { label: string; inputId: string; children: React.ReactNode }) { return <div className="grid gap-2"><Label htmlFor={inputId} className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f695c]">{label}</Label>{children}</div>; }

function PasswordInput({ id, value, onChange, visible, onVisibilityChange, autoComplete, ariaDescribedBy }: { id: string; value: string; onChange: (value: string) => void; visible: boolean; onVisibilityChange: (visible: boolean) => void; autoComplete: string; ariaDescribedBy?: string }) {
  return <div className="relative"><Input id={id} required autoComplete={autoComplete} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} placeholder={autoComplete === "new-password" ? "10 caractères minimum" : "Votre mot de passe"} aria-describedby={ariaDescribedBy} className="pr-12" /><button type="button" onClick={() => onVisibilityChange(!visible)} className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-md text-[#596456] hover:bg-[#eef0e7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5e7b52]" aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>;
}
