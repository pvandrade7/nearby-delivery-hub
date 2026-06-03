import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Plus, Trash2, Star, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type PaymentMethod = {
  id: string;
  holder_name: string;
  last_four: string;
  brand: string;
  expiry_month: string;
  expiry_year: string;
  is_default: boolean;
};

const BRANDS: Record<string, { label: string; color: string }> = {
  visa:       { label: "Visa",       color: "bg-blue-600" },
  mastercard: { label: "Mastercard", color: "bg-red-500" },
  elo:        { label: "Elo",        color: "bg-yellow-500" },
  amex:       { label: "Amex",       color: "bg-green-600" },
  hipercard:  { label: "Hipercard",  color: "bg-red-700" },
  outro:      { label: "Outro",      color: "bg-muted-foreground" },
};

const detectBrand = (num: string): string => {
  const n = num.replace(/\D/g, "");
  if (n.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mastercard";
  if (/^(636368|438935|504175|451416|636297)/.test(n)) return "elo";
  if (/^3[47]/.test(n)) return "amex";
  if (/^(606282|3841)/.test(n)) return "hipercard";
  return "outro";
};

const maskNumber = (num: string) => {
  const d = num.replace(/\D/g, "").slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
};

export default function PaymentMethods() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cards, setCards] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ number: "", holder_name: "", expiry: "", cvv: "" });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setCards((data as PaymentMethod[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const save = async () => {
    if (!user) return;
    const digits = form.number.replace(/\D/g, "");
    if (digits.length < 13) { toast.error("Número do cartão inválido"); return; }
    if (!form.holder_name.trim()) { toast.error("Informe o nome do titular"); return; }
    const [month, year] = form.expiry.split("/");
    if (!month || !year || month.length !== 2 || year.length !== 2) { toast.error("Validade inválida (MM/AA)"); return; }

    setSaving(true);
    const brand = detectBrand(digits);
    const { error } = await supabase.from("payment_methods").insert({
      user_id: user.id,
      holder_name: form.holder_name.trim().toUpperCase(),
      last_four: digits.slice(-4),
      brand,
      expiry_month: month,
      expiry_year: year,
      is_default: cards.length === 0,
    });
    setSaving(false);
    if (error) { toast.error("Erro ao salvar cartão"); return; }
    toast.success("Cartão adicionado!");
    setForm({ number: "", holder_name: "", expiry: "", cvv: "" });
    setShowForm(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("payment_methods").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover"); return; }
    toast.success("Cartão removido");
    load();
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    await supabase.from("payment_methods").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("payment_methods").update({ is_default: true }).eq("id", id);
    load();
  };

  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-extrabold">Formas de pagamento</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {cards.length === 0 && !showForm && (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Nenhum cartão salvo</p>
              <p className="text-sm mt-1">Adicione um cartão para pagar com mais facilidade</p>
            </div>
          )}

          {cards.map(c => {
            const brand = BRANDS[c.brand] ?? BRANDS.outro;
            return (
              <div key={c.id} className="bg-card rounded-2xl shadow-card p-4 flex items-center gap-4">
                <div className={`w-11 h-8 rounded-lg ${brand.color} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-[10px] font-extrabold leading-none">{brand.label}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">•••• •••• •••• {c.last_four}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.holder_name} · {c.expiry_month}/{c.expiry_year}</p>
                  {c.is_default && (
                    <span className="text-xs text-primary font-bold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Principal
                    </span>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {!c.is_default && (
                    <button onClick={() => setDefault(c.id)} className="text-xs text-primary font-bold hover:underline">
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => remove(c.id)} className="text-destructive hover:bg-destructive/10 rounded-lg p-1.5 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {showForm && (
            <div className="bg-card rounded-2xl shadow-card p-5 space-y-3">
              <h2 className="font-bold text-base">Novo cartão</h2>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-muted-foreground">Número do cartão</span>
                <input
                  value={form.number}
                  onChange={e => setForm(f => ({ ...f, number: maskNumber(e.target.value) }))}
                  placeholder="0000 0000 0000 0000"
                  inputMode="numeric"
                  maxLength={19}
                  className="bg-muted rounded-xl px-4 py-3 text-sm font-semibold tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-muted-foreground">Nome do titular</span>
                <input
                  value={form.holder_name}
                  onChange={e => setForm(f => ({ ...f, holder_name: e.target.value.toUpperCase() }))}
                  placeholder="NOME COMO NO CARTÃO"
                  className="bg-muted rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>

              <div className="flex gap-3">
                <label className="flex flex-col gap-1 flex-1">
                  <span className="text-xs font-bold text-muted-foreground">Validade</span>
                  <input
                    value={form.expiry}
                    onChange={e => setForm(f => ({ ...f, expiry: formatExpiry(e.target.value) }))}
                    placeholder="MM/AA"
                    inputMode="numeric"
                    maxLength={5}
                    className="bg-muted rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </label>
                <label className="flex flex-col gap-1 flex-1">
                  <span className="text-xs font-bold text-muted-foreground">CVV</span>
                  <input
                    value={form.cvv}
                    onChange={e => setForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    placeholder="•••"
                    inputMode="numeric"
                    maxLength={4}
                    type="password"
                    className="bg-muted rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </label>
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                🔒 Apenas os últimos 4 dígitos são armazenados. Seus dados são protegidos.
              </p>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-border font-bold text-sm hover:bg-muted/40">
                  Cancelar
                </button>
                <button onClick={save} disabled={saving} className="flex-1 py-3 rounded-xl gradient-brand text-primary-foreground font-bold text-sm disabled:opacity-60">
                  {saving ? "Salvando..." : "Adicionar cartão"}
                </button>
              </div>
            </div>
          )}

          {!showForm && (
            <button onClick={() => setShowForm(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Plus className="w-5 h-5" /> Adicionar cartão
            </button>
          )}
        </div>
      )}
    </div>
  );
}
