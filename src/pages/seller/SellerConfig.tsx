import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut, Pencil, Check, X, Store, BadgeCheck,
  Mail, Phone, MapPin, Tag, User,
} from "lucide-react";
import { ImagePicker } from "@/components/ImagePicker";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SELLER_CATEGORIES } from "@/data/sellerCategories";
import { toast } from "sonner";

type ProfileData = {
  name: string;
  phone: string;
  avatar: string;
  verified: boolean;
  cnpj: string;
};

type StoreData = {
  storeName: string;
  storeCategory: string;
  address: string;
};

type EditSection = "personal" | "store" | null;

const SellerConfig = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]   = useState<ProfileData>({ name: "", phone: "", avatar: "", verified: false, cnpj: "" });
  const [store, setStore]       = useState<StoreData>({ storeName: "", storeCategory: "", address: "" });
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<EditSection>(null);
  const [form, setForm]         = useState<ProfileData & StoreData>({
    name: "", phone: "", avatar: "", verified: false, cnpj: "",
    storeName: "", storeCategory: "", address: "",
  });
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, phone, avatar_url, verified, cnpj, extras")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("[SellerConfig]", error);
        if (data) {
          const ext = (data.extras as Record<string, string>) ?? {};
          setProfile({
            name:     data.display_name || "",
            phone:    data.phone || "",
            avatar:   data.avatar_url || "",
            verified: data.verified ?? false,
            cnpj:     data.cnpj || "",
          });
          setStore({
            storeName:     ext.storeName || "",
            storeCategory: ext.storeCategory || ext.category || "",
            address:       ext.address || "",
          });
        }
        setLoading(false);
      });
  }, [user]);

  const openEdit = (section: EditSection) => {
    setForm({ ...profile, ...store });
    setEditing(section);
  };

  const savePersonal = async () => {
    if (!user) return;
    if (!form.name.trim()) { toast.error("Nome não pode ficar em branco"); return; }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: form.name.trim(), phone: form.phone.trim() || null })
      .eq("id", user.id);
    if (error) { toast.error("Falha ao salvar"); }
    else {
      setProfile(p => ({ ...p, name: form.name.trim(), phone: form.phone.trim() }));
      toast.success("Dados pessoais atualizados!");
      setEditing(null);
    }
    setSaving(false);
  };

  const saveStore = async () => {
    if (!user) return;
    if (!form.storeName.trim()) { toast.error("Informe o nome da loja"); return; }
    setSaving(true);
    const { data: cur } = await supabase.from("profiles").select("extras").eq("id", user.id).maybeSingle();
    const extras = {
      ...((cur?.extras as Record<string, string>) ?? {}),
      storeName:     form.storeName.trim(),
      storeCategory: form.storeCategory,
      address:       form.address.trim(),
    };
    const { error } = await supabase.from("profiles").update({ extras }).eq("id", user.id);
    if (error) { toast.error("Falha ao salvar"); }
    else {
      setStore({ storeName: form.storeName.trim(), storeCategory: form.storeCategory, address: form.address.trim() });
      toast.success("Dados da loja atualizados!");
      setEditing(null);
    }
    setSaving(false);
  };

  const onAvatar = async (url: string) => {
    setProfile(p => ({ ...p, avatar: url }));
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    if (error) toast.error("Falha ao atualizar foto");
    else toast.success("Foto atualizada!");
  };

  const logout = async () => {
    await signOut();
    navigate("/lojista", { replace: true });
  };

  const displayName = profile.name || user?.email?.split("@")[0] || "Lojista";

  if (loading) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-40 bg-muted rounded animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card rounded-2xl p-5 shadow-card space-y-3">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-12 bg-muted rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl lg:text-3xl font-extrabold">Minha conta</h1>

      {/* ── Dados pessoais ─────────────────────────────────── */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Dados pessoais
          </p>
          {editing !== "personal" && (
            <button onClick={() => openEdit("personal")} className="p-2 rounded-xl hover:bg-muted/50 transition-colors" aria-label="Editar">
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 shrink-0">
            <ImagePicker value={profile.avatar} onChange={onAvatar} folder="avatar" shape="circle" label="Foto" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg leading-tight truncate">{displayName}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        {editing === "personal" ? (
          <div className="space-y-3 border-t border-border pt-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Nome</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full bg-muted rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Seu nome completo" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Telefone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                inputMode="tel"
                className="mt-1 w-full bg-muted rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="(00) 9 0000-0000" />
            </div>
            <div className="flex gap-2">
              <button onClick={savePersonal} disabled={saving}
                className="flex-1 gradient-brand text-primary-foreground rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                <Check className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar"}
              </button>
              <button onClick={() => setEditing(null)} disabled={saving}
                className="px-4 border border-border rounded-xl font-bold text-sm hover:bg-muted/40 disabled:opacity-60">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate">{user?.email || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-semibold">{profile.phone || <span className="text-muted-foreground">Não informado</span>}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Dados da loja ──────────────────────────────────── */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5" /> Dados da loja
          </p>
          {editing !== "store" && (
            <button onClick={() => openEdit("store")} className="p-2 rounded-xl hover:bg-muted/50 transition-colors" aria-label="Editar loja">
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {editing === "store" ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Nome da loja</label>
              <input value={form.storeName} onChange={e => setForm(f => ({ ...f, storeName: e.target.value }))}
                maxLength={80}
                className="mt-1 w-full bg-muted rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Nome da loja" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">Categoria</label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {SELLER_CATEGORIES.map(c => (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, storeCategory: c }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      form.storeCategory === c
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Endereço comercial</label>
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="mt-1 w-full bg-muted rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Rua, número e bairro" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveStore} disabled={saving}
                className="flex-1 gradient-brand text-primary-foreground rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                <Check className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar"}
              </button>
              <button onClick={() => setEditing(null)} disabled={saving}
                className="px-4 border border-border rounded-xl font-bold text-sm hover:bg-muted/40 disabled:opacity-60">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Store className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-semibold">{store.storeName || <span className="text-muted-foreground">Não configurado</span>}</span>
            </div>
            {store.storeCategory && (
              <div className="flex items-center gap-2 text-sm">
                <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{store.storeCategory}</span>
              </div>
            )}
            {store.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{store.address}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Status de verificação ──────────────────────────── */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-3">
          <BadgeCheck className="w-3.5 h-3.5" /> Verificação
        </p>
        {profile.verified ? (
          <div className="flex items-center justify-between">
            <div>
              <VerifiedBadge />
              <p className="text-xs text-muted-foreground mt-1">
                {profile.cnpj ? `CNPJ: ${profile.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")}` : "Verificação manual aprovada"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs font-bold">
                Não verificado
              </span>
              <p className="text-xs text-muted-foreground mt-1">Obtenha o selo verificado para mais credibilidade</p>
            </div>
            <button onClick={() => navigate("/lojista/verificacao")}
              className="text-xs font-bold text-primary hover:underline shrink-0 ml-3">
              Verificar →
            </button>
          </div>
        )}
      </div>

      {/* ── Ações ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <button onClick={() => navigate("/lojista/painel")}
          className="w-full py-3 rounded-2xl bg-muted text-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-muted/70 transition-colors">
          <Store className="w-4 h-4" /> Ir ao painel da loja
        </button>
        <button onClick={logout}
          className="w-full py-3 rounded-2xl border border-destructive/30 text-destructive font-semibold text-sm flex items-center justify-center gap-2 hover:bg-destructive/5 transition-colors">
          <LogOut className="w-4 h-4" /> Sair da conta
        </button>
      </div>
    </div>
  );
};

export default SellerConfig;
