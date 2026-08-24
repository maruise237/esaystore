import { useState } from "react";
import { Loader2, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function TeamPanel({ shopId }: { shopId: string }) {
  const utils = trpc.useUtils();
  const members = trpc.shops.members.useQuery({ shopId });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "seller">("seller");
  const addMember = trpc.shops.addMember.useMutation({
    onSuccess: () => { setEmail(""); utils.shops.members.invalidate({ shopId }); },
  });

  return <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
    <Card className="h-fit border-0 bg-[#edf1e3]"><CardContent className="p-6"><div className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-[#4e6b48]" /><p className="font-serif text-xl">Ajouter un collaborateur</p></div><p className="mt-2 text-sm leading-relaxed text-[#6f786e]">Le collaborateur doit d’abord avoir créé son compte EASYSTOR avec cet e-mail.</p><form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); addMember.mutate({ shopId, email, role }); }}><label className="grid gap-2"><Label className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f695c]">E-mail</Label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vendeur@boutique.com" required /></label><label className="grid gap-2"><Label className="text-xs font-bold uppercase tracking-[0.12em] text-[#5f695c]">Rôle</Label><select value={role} onChange={(event) => setRole(event.target.value as "manager" | "seller")} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="seller">Vendeur</option><option value="manager">Gérant</option></select></label><Button type="submit" disabled={addMember.isPending || !email} className="w-full bg-[#415b3c]">{addMember.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Ajouter à la boutique</Button>{addMember.error && <p className="text-xs text-red-600">{addMember.error.message}</p>}</form></CardContent></Card>
    <Card className="border-0 bg-white shadow-[0_12px_30px_rgba(43,47,38,0.05)]"><CardContent className="p-5 sm:p-7"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-[#577651]" /><div><p className="font-serif text-xl">Équipe de la boutique</p><p className="mt-1 text-xs text-[#85877f]">Les permissions sont appliquées par boutique côté API.</p></div></div><div className="mt-5 space-y-3">{members.data?.map((member) => <div key={member.id} className="flex items-center justify-between rounded-2xl border border-[#ece9df] px-4 py-3"><div><p className="font-semibold">{member.name || member.email}</p><p className="mt-1 text-xs text-[#85877f]">{member.email}</p></div><span className="rounded-full bg-[#edf1e3] px-3 py-1 text-xs font-bold capitalize text-[#4f6c4b]">{member.role === "owner" ? "Patron" : member.role === "manager" ? "Gérant" : "Vendeur"}</span></div>)}{!members.data?.length && <p className="py-10 text-center text-sm text-[#85877f]">Aucun collaborateur trouvé.</p>}</div></CardContent></Card>
  </div>;
}
