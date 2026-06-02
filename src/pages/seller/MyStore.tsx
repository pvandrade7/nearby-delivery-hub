import { useEffect, useMemo, useState } from "react";
import {
  Save, Store, Phone, Mail, MapPin, AtSign, Globe, Truck,
  Clock, Palette, MessageSquare, Share2, RefreshCw, Eye,
  Package, ShieldCheck, Star, Link2,
} from "lucide-react";
import { ImagePicker } from "@/components/ImagePicker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SELLER_CATEGORIES } from "@/data/sellerCategories";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "identidade" | "informacoes" | "personalizacao" | "previa";

type DayHours = { active: boolean; open: string; close: string };
type WeekHours = Record<string, DayHours>;

type StoreForm = {
  storeName: string;
  storeLogo: string;
  storeBanner: string;
  brandColor: string;
  storeDescription: string;
  storeSlogan: string;
  storeCategory: string;
  storeSecondaryCategories: string;
  storePhone: string;
  storeWhatsapp: string;
  storeEmail: string;
  storeAddress: string;
  storeHours: string;
  storeDeliveryMethods: string;
  storeReturnPolicy: string;
  storeWelcomeMessage: string;
  storeDeliveryInfo: string;
  storeInstagram: string;
  storeFacebook: string;
  storeSite: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: "identidade",     label: "Identidade"     },
  { key: "informacoes",    label: "Informações"    },
  { key: "personalizacao", label: "Personalização" },
  { key: "previa",         label: "Prévia"         },
];

const WEEK_DAYS = [
  { key: "seg", short: "Seg", label: "Segunda-feira" },
  { key: "ter", short: "Ter", label: "Terça-feira"   },
  { key: "qua", short: "Qua", label: "Quarta-feira"  },
  { key: "qui", short: "Qui", label: "Quinta-feira"  },
  { key: "sex", short: "Sex", label: "Sexta-feira"   },
  { key: "sab", short: "Sáb", label: "Sábado"        },
  { key: "dom", short: "Dom", label: "Domingo"       },
];

const DELIVERY_OPTIONS = [
  { key: "motoboy",   label: "Motoboy"           },
  { key: "carro",     label: "Carro"             },
  { key: "retirada",  label: "Retirada na loja"  },
  { key: "meetup",    label: "Ponto de encontro" },
  { key: "combinado", label: "A combinar"        },
];

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f59e0b", "#10b981", "#3b82f6", "#14b8a6",
];

const DEFAULT_HOURS: WeekHours = {
  seg: { active: true,  open: "08:00", close: "18:00" },
  ter: { active: true,  open: "08:00", close: "18:00" },
  qua: { active: true,  open: "08:00", close: "18:00" },
  qui: { active: true,  open: "08:00", close: "18:00" },
  sex: { active: true,  open: "08:00", close: "18:00" },
  sab: { active: true,  open: "09:00", close: "14:00" },
  dom: { active: false, open: "09:00", close: "13:00" },
};

const EMPTY_FORM: StoreForm = {
  storeName: "", storeLogo: "", storeBanner: "", brandColor: "#6366f1",
  storeDescription: "", storeSlogan: "", storeCategory: "",
  storeSecondaryCategories: "", storePhone: "", storeWhatsapp: "",
  storeEmail: "", storeAddress: "", storeHours: JSON.stringify(DEFAULT_HOURS),
  storeDeliveryMethods: "motoboy,retirada", storeReturnPolicy: "",
  storeWelcomeMessage: "", storeDeliveryInfo: "",
  storeInstagram: "", storeFacebook: "", storeSite: "",
};

const DEMO_FORM: StoreForm = {
  storeName: "Loja Demonstração",
  storeLogo: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&q=75",
  storeBanner: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=75",
  brandColor: "#6366f1",
  storeDescription: "Uma loja completa com os melhores produtos para seu dia a dia. Qualidade garantida e entrega rápida em toda a cidade.",
  storeSlogan: "Qualidade que você pode confiar!",
  storeCategory: "Eletrônicos",
  storeSecondaryCategories: "Acessórios,Utilidades Domésticas",
  storePhone: "(85) 9 9999-0000",
  storeWhatsapp: "85999990000",
  storeEmail: "contato@lojademo.com",
  storeAddress: "Rua das Flores, 123 - Centro, Fortaleza - CE",
  storeHours: JSON.stringify({
    seg: { active: true,  open: "08:00", close: "18:00" },
    ter: { active: true,  open: "08:00", close: "18:00" },
    qua: { active: true,  open: "08:00", close: "18:00" },
    qui: { active: true,  open: "08:00", close: "18:00" },
    sex: { active: true,  open: "08:00", close: "18:00" },
    sab: { active: true,  open: "09:00", close: "14:00" },
    dom: { active: false, open: "09:00", close: "13:00" },
  }),
  storeDeliveryMethods: "motoboy,retirada",
  storeReturnPolicy: "Aceitamos trocas em até 7 dias após a compra. O produto deve estar na embalagem original.",
  storeWelcomeMessage: "Bem-vindo! Oferecemos os melhores produtos com qualidade garantida.",
  storeDeliveryInfo: "Entregamos em toda a cidade. Prazo médio de 1–2 dias úteis. Frete grátis acima de R$ 100,00.",
  storeInstagram: "@loja_demo",
  storeFacebook: "lojademo",
  storeSite: "www.lojademo.com.br",
};

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full bg-muted rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50";

const textareaCls =
  "w-full bg-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground/50";

// ── Field wrapper (defined outside component — stable reference) ───────────────

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
      {label}
    </label>
    {children}
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

const MyStore = () => {
  const { user, isDemo } = useAuth();
  const [tab, setTab]         = useState<Tab>("identidade");
  const [form, setForm]       = useState<StoreForm>(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Derived state ──────────────────────────────────────────────────────────

  const hours = useMemo<WeekHours>(() => {
    try { return JSON.parse(form.storeHours) as WeekHours; }
    catch { return DEFAULT_HOURS; }
  }, [form.storeHours]);

  const secondaryCats = useMemo(
    () => form.storeSecondaryCategories.split(",").filter(Boolean),
    [form.storeSecondaryCategories],
  );

  const deliveryMethods = useMemo(
    () => form.storeDeliveryMethods.split(",").filter(Boolean),
    [form.storeDeliveryMethods],
  );

  // ── Load ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isDemo) { setForm(DEMO_FORM); setLoading(false); return; }
    if (!user) return;
    supabase
      .from("profiles")
      .select("extras")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const e = (data?.extras as Record<string, string>) ?? {};
        setForm({
          storeName:                e.storeName                || "",
          storeLogo:                e.storeLogo || e.storeImage || "",
          storeBanner:              e.storeBanner               || "",
          brandColor:               e.brandColor                || "#6366f1",
          storeDescription:         e.storeDescription          || "",
          storeSlogan:              e.storeSlogan               || "",
          storeCategory:            e.storeCategory || e.category || "",
          storeSecondaryCategories: e.storeSecondaryCategories  || "",
          storePhone:               e.storePhone || e.phone      || "",
          storeWhatsapp:            e.storeWhatsapp             || "",
          storeEmail:               e.storeEmail                || "",
          storeAddress:             e.storeAddress || e.address  || "",
          storeHours:               e.storeHours                || JSON.stringify(DEFAULT_HOURS),
          storeDeliveryMethods:     e.storeDeliveryMethods      || "motoboy,retirada",
          storeReturnPolicy:        e.storeReturnPolicy         || "",
          storeWelcomeMessage:      e.storeWelcomeMessage       || "",
          storeDeliveryInfo:        e.storeDeliveryInfo         || "",
          storeInstagram:           e.storeInstagram            || "",
          storeFacebook:            e.storeFacebook             || "",
          storeSite:                e.storeSite                 || "",
        });
        setLoading(false);
      });
  }, [user?.id, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ────────────────────────────────────────────────────────────────

  const up = (k: keyof StoreForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleSecCat = (cat: string) => {
    const s = new Set(secondaryCats);
    s.has(cat) ? s.delete(cat) : s.add(cat);
    up("storeSecondaryCategories", [...s].join(","));
  };

  const toggleDelivery = (method: string) => {
    const s = new Set(deliveryMethods);
    s.has(method) ? s.delete(method) : s.add(method);
    up("storeDeliveryMethods", [...s].join(","));
  };

  const updateHours = (day: string, patch: Partial<DayHours>) => {
    const next = { ...hours, [day]: { ...hours[day], ...patch } };
    up("storeHours", JSON.stringify(next));
  };

  const save = async () => {
    if (isDemo) { toast.info("Salvar desabilitado no modo demonstração."); return; }
    if (!user) return;
    if (!form.storeName.trim()) { toast.error("O nome da loja é obrigatório."); return; }
    setSaving(true);
    try {
      const { data: cur } = await supabase
        .from("profiles").select("extras").eq("id", user.id).maybeSingle();
      const extras = {
        ...((cur?.extras as Record<string, string>) ?? {}),
        ...form,
        storeName:  form.storeName.trim(),
        storeImage: form.storeLogo,
      };
      const { error } = await supabase
        .from("profiles").update({ extras }).eq("id", user.id);
      if (error) throw error;
      toast.success("Loja atualizada com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  // ── Skeleton ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-5">
        <div className="h-8 w-48 bg-muted rounded-xl animate-pulse" />
        <div className="flex gap-2">
          {[1,2,3,4].map(i => <div key={i} className="h-10 w-28 bg-muted rounded-full animate-pulse" />)}
        </div>
        <div className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const SaveBtn = ({ full }: { full?: boolean }) => (
    <button
      onClick={save}
      disabled={saving}
      className={`inline-flex items-center justify-center gap-2 gradient-brand text-primary-foreground rounded-xl px-5 py-2.5 font-bold shadow-card hover:shadow-elevated transition-shadow disabled:opacity-60 ${full ? "w-full py-3.5" : "shrink-0"}`}
    >
      {saving
        ? <><RefreshCw className="w-4 h-4 animate-spin" /> Salvando...</>
        : <><Save className="w-4 h-4" /> Salvar alterações</>
      }
    </button>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold">Minha Loja</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personalize a identidade visual e as informações públicas da sua loja
          </p>
        </div>
        <SaveBtn />
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              tab === key
                ? "gradient-brand text-primary-foreground shadow-card"
                : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TAB 1 — IDENTIDADE VISUAL
      ═══════════════════════════════════════════════════════════ */}
      {tab === "identidade" && (
        <div className="space-y-5">

          {/* Logo + Banner */}
          <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-card">
            <h2 className="font-bold text-base mb-1">Imagens da loja</h2>
            <p className="text-xs text-muted-foreground mb-5">
              A logo aparece no perfil da loja. O banner é exibido na página principal.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Logo da loja</p>
                <div className="w-32">
                  <ImagePicker
                    value={form.storeLogo}
                    onChange={(url) => up("storeLogo", url)}
                    folder="store-logo"
                    shape="circle"
                    label="Adicionar logo"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">Recomendado: quadrado, mín. 200×200 px</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Banner / Capa</p>
                <ImagePicker
                  value={form.storeBanner}
                  onChange={(url) => up("storeBanner", url)}
                  folder="store-banner"
                  shape="rect"
                  label="Adicionar banner"
                />
                <p className="text-[11px] text-muted-foreground mt-2">Recomendado: 1200×400 px, proporção 3:1</p>
              </div>
            </div>
          </div>

          {/* Preview topo */}
          <div className="bg-card rounded-2xl overflow-hidden shadow-card">
            <div className="px-5 lg:px-6 py-4 border-b border-border">
              <h2 className="font-bold text-base">Pré-visualização do topo</h2>
              <p className="text-xs text-muted-foreground">Como o banner e a logo aparecem na sua página</p>
            </div>
            <div className="relative h-32 bg-gradient-to-r from-primary/20 via-secondary/10 to-primary/10">
              {form.storeBanner && (
                <img src={form.storeBanner} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute bottom-0 left-6 translate-y-1/2 size-16 rounded-2xl border-4 border-card shadow-card overflow-hidden bg-muted flex items-center justify-center">
                {form.storeLogo
                  ? <img src={form.storeLogo} alt="" className="w-full h-full object-cover" />
                  : <Store className="w-7 h-7 text-muted-foreground" />
                }
              </div>
            </div>
            <div className="px-6 pt-10 pb-5">
              <p className="font-extrabold text-lg">{form.storeName || "Nome da loja"}</p>
              {form.storeSlogan && (
                <p className="text-sm text-muted-foreground italic mt-0.5">"{form.storeSlogan}"</p>
              )}
              {form.storeCategory && (
                <span className="inline-block mt-2 text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  {form.storeCategory}
                </span>
              )}
            </div>
          </div>

          {/* Cor da marca */}
          <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-card">
            <h2 className="font-bold text-base mb-1">Cor da marca</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Usada nos destaques e elementos visuais da sua vitrine.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => up("brandColor", color)}
                  style={{ backgroundColor: color }}
                  className={`size-9 rounded-full transition-all ${
                    form.brandColor === color
                      ? "ring-2 ring-offset-2 ring-foreground/30 scale-110"
                      : "hover:scale-105"
                  }`}
                />
              ))}
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  style={{ backgroundColor: form.brandColor }}
                  className="size-9 rounded-full border-2 border-dashed border-foreground/25 flex items-center justify-center group-hover:scale-105 transition-all"
                >
                  <Palette className="w-3.5 h-3.5 text-white/80" />
                </div>
                <span className="text-xs font-mono text-muted-foreground">{form.brandColor}</span>
                <input
                  type="color"
                  value={form.brandColor}
                  onChange={(e) => up("brandColor", e.target.value)}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2 — INFORMAÇÕES
      ═══════════════════════════════════════════════════════════ */}
      {tab === "informacoes" && (
        <div className="space-y-5">

          {/* Dados básicos */}
          <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-card space-y-4">
            <h2 className="font-bold text-base">Dados básicos</h2>
            <Field label="Nome da loja *">
              <input
                value={form.storeName}
                onChange={(e) => up("storeName", e.target.value)}
                maxLength={80}
                placeholder="Ex: Tech Zone Acessórios"
                className={inputCls}
              />
            </Field>
            <Field label="Slogan (opcional)">
              <input
                value={form.storeSlogan}
                onChange={(e) => up("storeSlogan", e.target.value)}
                maxLength={120}
                placeholder="Ex: Qualidade que você pode confiar!"
                className={inputCls}
              />
            </Field>
            <Field label="Descrição da loja">
              <textarea
                value={form.storeDescription}
                onChange={(e) => up("storeDescription", e.target.value)}
                rows={4}
                maxLength={600}
                placeholder="Conte um pouco sobre sua loja, diferenciais e o que você vende..."
                className={textareaCls}
              />
              <p className="text-[11px] text-muted-foreground text-right mt-1">
                {form.storeDescription.length}/600
              </p>
            </Field>
          </div>

          {/* Categorias */}
          <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-card space-y-5">
            <h2 className="font-bold text-base">Categorias</h2>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Categoria principal *</p>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                {SELLER_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => up("storeCategory", c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      form.storeCategory === c
                        ? "bg-primary text-primary-foreground border-primary shadow-card"
                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Categorias secundárias (selecione todas que se aplicam)
              </p>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                {SELLER_CATEGORIES.filter((c) => c !== form.storeCategory).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleSecCat(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      secondaryCats.includes(c)
                        ? "bg-secondary text-secondary-foreground border-secondary shadow-card"
                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-card space-y-4">
            <h2 className="font-bold text-base">Contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Telefone">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={form.storePhone}
                    onChange={(e) => up("storePhone", e.target.value)}
                    placeholder="(00) 9 0000-0000"
                    inputMode="tel"
                    className={inputCls + " pl-10"}
                  />
                </div>
              </Field>
              <Field label="WhatsApp">
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={form.storeWhatsapp}
                    onChange={(e) => up("storeWhatsapp", e.target.value)}
                    placeholder="00 9 0000-0000 (só números)"
                    inputMode="numeric"
                    className={inputCls + " pl-10"}
                  />
                </div>
              </Field>
              <Field label="E-mail de contato">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={form.storeEmail}
                    onChange={(e) => up("storeEmail", e.target.value)}
                    type="email"
                    placeholder="contato@minhaloja.com"
                    className={inputCls + " pl-10"}
                  />
                </div>
              </Field>
              <Field label="Endereço comercial">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={form.storeAddress}
                    onChange={(e) => up("storeAddress", e.target.value)}
                    placeholder="Rua, número, bairro, cidade"
                    className={inputCls + " pl-10"}
                  />
                </div>
              </Field>
            </div>
          </div>

          {/* Horário */}
          <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-bold text-base">Horário de funcionamento</h2>
            </div>
            <div className="space-y-2">
              {WEEK_DAYS.map(({ key, short }) => {
                const day = hours[key] ?? DEFAULT_HOURS[key];
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                      day.active ? "bg-muted/60" : "bg-muted/20"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => updateHours(key, { active: !day.active })}
                      className={`relative shrink-0 size-6 rounded-full border-2 transition-colors flex items-center justify-center ${
                        day.active ? "border-primary bg-primary" : "border-border bg-muted"
                      }`}
                    >
                      {day.active && <span className="block size-2.5 rounded-full bg-primary-foreground" />}
                    </button>
                    <span className={`text-sm font-semibold w-9 shrink-0 ${day.active ? "" : "text-muted-foreground"}`}>
                      {short}
                    </span>
                    {day.active ? (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <input
                          type="time"
                          value={day.open}
                          onChange={(e) => updateHours(key, { open: e.target.value })}
                          className="bg-background border border-border rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                        <span className="text-xs text-muted-foreground">às</span>
                        <input
                          type="time"
                          value={day.close}
                          onChange={(e) => updateHours(key, { close: e.target.value })}
                          className="bg-background border border-border rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Fechado</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 3 — PERSONALIZAÇÃO
      ═══════════════════════════════════════════════════════════ */}
      {tab === "personalizacao" && (
        <div className="space-y-5">

          {/* Métodos de entrega */}
          <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-card">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-bold text-base">Métodos de entrega</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Selecione todas as formas de entrega que sua loja oferece.
            </p>
            <div className="flex flex-wrap gap-2">
              {DELIVERY_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDelivery(key)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    deliveryMethods.includes(key)
                      ? "gradient-brand text-primary-foreground border-transparent shadow-card"
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mensagens */}
          <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-card space-y-4">
            <h2 className="font-bold text-base">Mensagens da loja</h2>
            <Field label="Mensagem de boas-vindas">
              <textarea
                value={form.storeWelcomeMessage}
                onChange={(e) => up("storeWelcomeMessage", e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Bem-vindo à nossa loja! Temos os melhores produtos para você..."
                className={textareaCls}
              />
              <p className="text-[11px] text-muted-foreground text-right mt-1">
                {form.storeWelcomeMessage.length}/300
              </p>
            </Field>
            <Field label="Informações sobre entrega">
              <textarea
                value={form.storeDeliveryInfo}
                onChange={(e) => up("storeDeliveryInfo", e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Entregamos em toda a cidade. Prazo médio de 1–2 dias úteis..."
                className={textareaCls}
              />
            </Field>
            <Field label="Política de trocas e devoluções">
              <textarea
                value={form.storeReturnPolicy}
                onChange={(e) => up("storeReturnPolicy", e.target.value)}
                rows={3}
                maxLength={400}
                placeholder="Aceitamos trocas em até 7 dias após a compra..."
                className={textareaCls}
              />
            </Field>
          </div>

          {/* Redes sociais */}
          <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-card space-y-4">
            <h2 className="font-bold text-base">Redes sociais e site</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Instagram">
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={form.storeInstagram}
                    onChange={(e) => up("storeInstagram", e.target.value)}
                    placeholder="@sua_loja"
                    className={inputCls + " pl-10"}
                  />
                </div>
              </Field>
              <Field label="Facebook">
                <div className="relative">
                  <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={form.storeFacebook}
                    onChange={(e) => up("storeFacebook", e.target.value)}
                    placeholder="nomedaloja"
                    className={inputCls + " pl-10"}
                  />
                </div>
              </Field>
              <Field label="Site oficial">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={form.storeSite}
                    onChange={(e) => up("storeSite", e.target.value)}
                    placeholder="www.minhaloja.com.br"
                    className={inputCls + " pl-10"}
                  />
                </div>
              </Field>
            </div>
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 4 — PRÉVIA
      ═══════════════════════════════════════════════════════════ */}
      {tab === "previa" && (() => {
        const todayKey = ["dom","seg","ter","qua","qui","sex","sab"][new Date().getDay()];
        const todayHours = hours[todayKey];

        return (
          <div className="space-y-5">
            <div className="bg-card rounded-2xl p-5 lg:p-6 shadow-card">
              <h2 className="font-bold text-base mb-1">Como os clientes verão sua loja</h2>
              <p className="text-xs text-muted-foreground mb-6">
                Prévia em tempo real — atualiza conforme você edita as abas anteriores.
              </p>

              <div className="max-w-sm mx-auto">
                <div className="bg-background rounded-2xl shadow-elevated overflow-hidden border border-border">

                  {/* Banner */}
                  <div className="relative h-32 bg-gradient-to-r from-primary/20 via-secondary/10 to-primary/5">
                    {form.storeBanner && (
                      <img src={form.storeBanner} alt="" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute bottom-0 left-4 translate-y-1/2 size-14 rounded-xl border-4 border-background shadow-card overflow-hidden bg-muted flex items-center justify-center">
                      {form.storeLogo
                        ? <img src={form.storeLogo} alt="" className="w-full h-full object-cover" />
                        : <Store className="w-6 h-6 text-muted-foreground" />
                      }
                    </div>
                    <div
                      className="absolute top-2 right-2 size-3 rounded-full opacity-60"
                      style={{ backgroundColor: form.brandColor }}
                    />
                  </div>

                  {/* Content */}
                  <div className="px-4 pt-9 pb-5 space-y-3">
                    <div>
                      <h3 className="font-extrabold text-lg leading-tight">
                        {form.storeName || <span className="text-muted-foreground">Nome da loja</span>}
                      </h3>
                      {form.storeSlogan && (
                        <p className="text-xs text-muted-foreground italic mt-0.5">"{form.storeSlogan}"</p>
                      )}
                    </div>

                    {/* Category chips */}
                    <div className="flex flex-wrap gap-1">
                      {form.storeCategory && (
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white"
                          style={{ backgroundColor: form.brandColor }}
                        >
                          {form.storeCategory}
                        </span>
                      )}
                      {secondaryCats.slice(0, 2).map((c) => (
                        <span key={c} className="px-2.5 py-0.5 bg-muted text-muted-foreground rounded-full text-[11px] font-semibold">
                          {c}
                        </span>
                      ))}
                    </div>

                    {form.storeDescription && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {form.storeDescription}
                      </p>
                    )}

                    {todayHours && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {todayHours.active
                          ? <span className="text-success font-semibold">Aberto · {todayHours.open}–{todayHours.close}</span>
                          : <span className="text-destructive font-semibold">Fechado hoje</span>
                        }
                      </div>
                    )}

                    <div className="space-y-1">
                      {form.storePhone && (
                        <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="w-3 h-3 shrink-0" /> {form.storePhone}
                        </p>
                      )}
                      {form.storeAddress && (
                        <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{form.storeAddress}</span>
                        </p>
                      )}
                      {form.storeSite && (
                        <p className="text-xs flex items-center gap-1.5 text-muted-foreground">
                          <Globe className="w-3 h-3 shrink-0" /> {form.storeSite}
                        </p>
                      )}
                    </div>

                    {deliveryMethods.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {deliveryMethods.map((m) => (
                          <span key={m} className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-[10px] font-semibold flex items-center gap-1">
                            <Truck className="w-2.5 h-2.5" />
                            {DELIVERY_OPTIONS.find((d) => d.key === m)?.label || m}
                          </span>
                        ))}
                      </div>
                    )}

                    {form.storeWelcomeMessage && (
                      <div className="bg-muted/60 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          "{form.storeWelcomeMessage}"
                        </p>
                      </div>
                    )}

                    {/* Mock product strip */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Produtos em destaque
                      </p>
                      <div className="flex gap-2">
                        {[1,2,3].map((n) => (
                          <div key={n} className="flex-1 bg-muted rounded-xl p-2 space-y-1.5">
                            <div className="aspect-square bg-muted-foreground/10 rounded-lg flex items-center justify-center">
                              <Package className="w-4 h-4 text-muted-foreground/40" />
                            </div>
                            <div className="h-1.5 bg-muted-foreground/10 rounded" />
                            <div className="h-1.5 w-2/3 bg-muted-foreground/10 rounded" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map((s) => (
                        <Star
                          key={s}
                          className="w-3.5 h-3.5"
                          fill={s <= 4 ? form.brandColor : "transparent"}
                          style={{ color: s <= 4 ? form.brandColor : "#d1d5db" }}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">4.8 (127 avaliações)</span>
                    </div>

                    {/* Social */}
                    {(form.storeInstagram || form.storeFacebook) && (
                      <div className="flex gap-3">
                        {form.storeInstagram && (
                          <p className="text-xs flex items-center gap-1 text-muted-foreground">
                            <AtSign className="w-3 h-3" /> {form.storeInstagram}
                          </p>
                        )}
                        {form.storeFacebook && (
                          <p className="text-xs flex items-center gap-1 text-muted-foreground">
                            <Link2 className="w-3 h-3" /> {form.storeFacebook}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Badges */}
                    <div className="flex gap-3 pt-1 border-t border-border">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <ShieldCheck className="w-3 h-3 text-success" /> Loja verificada
                      </div>
                      {form.storeReturnPolicy && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <RefreshCw className="w-3 h-3" /> Trocas aceitas
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-3">
                  Prévia · os produtos reais aparecem para os clientes
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bottom save (mobile) */}
      {tab !== "previa" && (
        <div className="pb-4">
          <SaveBtn full />
        </div>
      )}

    </div>
  );
};

export default MyStore;
