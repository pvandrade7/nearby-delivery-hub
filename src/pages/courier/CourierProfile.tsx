import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut, Pencil, Check, X, Bike, MapPin, Star,
  Wallet, Clock, Mail, Phone, CreditCard, CheckCircle2,
} from "lucide-react";
import { ImagePicker } from "@/components/ImagePicker";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CourierProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [name,     setName]     = useState("");
  const [phone,    setPhone]    = useState("");
  const [vehicle,  setVehicle]  = useState("");
  const [region,   setRegion]   = useState("");
  const [document, setDocument] = useState("");
  const [cnh,      setCnh]      = useState("");
  const [avatar,   setAvatar]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", vehicle: "", region: "", document: "", cnh: "" });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, phone, avatar_url, extras")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("[CourierProfile]", error);
        if (data) {
          const ext = (data.extras as Record<string, string>) ?? {};
          setName(data.display_name || "");
          setPhone(data.phone || "");
          setAvatar(data.avatar_url || "");
          setVehicle(ext.vehicle || "");
          setRegion(ext.region || "");
          setDocument(ext.document || "");
          setCnh(ext.cnh || "");
        }
        setLoading(false);
      });
  }, [user]);

  const openEdit = () => {
    setForm({ name, phone, vehicle, region, document, cnh });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!user) return;
    if (!form.name.trim()) { toast.error("Nome não pode ficar em branco"); return; }
    setSaving(true);

    const { data: cur } = await supabase.from("profiles").select("extras").eq("id", user.id).maybeSingle();
    const extras = {
      ...((cur?.extras as Record<string, string>) ?? {}),
      vehicle:  form.vehicle,
      region:   form.region,
      document: form.document,
      cnh:      form.cnh,
    };

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: form.name.trim(), phone: form.phone.trim() || null, extras })
      .eq("id", user.id);

    if (error) {
      toast.error("Falha ao salvar dados");
    } else {
      setName(form.name.trim());
      setPhone(form.phone.trim());
      setVehicle(form.vehicle);
      setRegion(form.region);
      setDocument(form.document);
      setCnh(form.cnh);
      toast.success("Perfil atualizado!");
      setEditing(false);
    }
    setSaving(false);
  };

  const onAvatar = async (url: string) => {
    setAvatar(url);
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    if (error) toast.error("Falha ao atualizar foto");
    else toast.success("Foto atualizada!");
  };

  const logout = async () => {
    await signOut();
    navigate("/entregador", { replace: true });
  };

  const displayName = name || user?.email?.split("@")[0] || "Entregador";
  const isApproved = !!(vehicle || cnh || document); // protótipo: aprovado se tem dados de entregador

  if (loading) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-40 bg-muted rounded animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card rounded-2xl p-5 shadow-card">
            <div className="h-16 bg-muted rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl lg:text-3xl font-extrabold">Meu perfil</h1>

      {/* ── Card principal ─────────────────────────────────── */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-16 shrink-0">
            <ImagePicker value={avatar} onChange={onAvatar} folder="avatar" shape="circle" label="Foto" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg leading-tight truncate">{displayName}</p>
            <p className="text-sm text-muted-foreground truncate">{phone || user?.email || ""}</p>
            {isApproved && (
              <span className="inline-flex items-center gap-1 bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border border-success/20">
                <CheckCircle2 className="w-3 h-3" /> Entregador ativo
              </span>
            )}
          </div>
          {!editing && (
            <button onClick={openEdit} className="shrink-0 p-2 rounded-xl hover:bg-muted/50 transition-colors" aria-label="Editar perfil">
              <Pencil className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Edição inline */}
        {editing && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            {[
              { label: "Nome", key: "name", placeholder: "Seu nome completo" },
              { label: "Telefone", key: "phone", placeholder: "(00) 9 0000-0000", inputMode: "tel" },
              { label: "Veículo", key: "vehicle", placeholder: "Ex: Moto, Bicicleta, Carro" },
              { label: "Região de atuação", key: "region", placeholder: "Ex: Centro, Vila Nova..." },
              { label: "Documento (CPF ou RG)", key: "document", placeholder: "000.000.000-00" },
              { label: "CNH (número)", key: "cnh", placeholder: "00000000000" },
            ].map(({ label, key, placeholder, inputMode }) => (
              <div key={key}>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{label}</label>
                <input
                  value={form[key as keyof typeof form] as string}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  inputMode={inputMode as "tel" | undefined}
                  className="mt-1 w-full bg-muted rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 gradient-brand text-primary-foreground rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                <Check className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar"}
              </button>
              <button onClick={() => setEditing(false)} disabled={saving}
                className="px-4 border border-border rounded-xl font-bold text-sm hover:bg-muted/40 disabled:opacity-60">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Dados resumidos (fora do modo edição) */}
        {!editing && (
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate">{user?.email || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-semibold">{phone || <span className="text-muted-foreground">Não informado</span>}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Wallet, label: "Saldo",     value: "R$ 142,80", color: "text-primary",  bg: "bg-primary/10"  },
          { icon: Star,   label: "Avaliação", value: "4.9 ⭐",    color: "text-warning",  bg: "bg-warning/15"  },
          { icon: Clock,  label: "Entregas",  value: "8 hoje",    color: "text-success",  bg: "bg-success/15"  },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl p-4 shadow-card text-center">
            <div className={`size-8 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mx-auto mb-2`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="font-extrabold text-sm">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Informações operacionais ────────────────────────── */}
      {(vehicle || region || document || cnh) && (
        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-5 py-3 border-b border-border">
            Dados operacionais
          </p>
          {[
            vehicle  && { icon: Bike,       label: "Veículo",          value: vehicle  },
            region   && { icon: MapPin,      label: "Região de atuação", value: region   },
            document && { icon: CreditCard,  label: "Documento",        value: document },
            cnh      && { icon: CreditCard,  label: "CNH",              value: cnh      },
          ].filter(Boolean).map((item: { icon: typeof Bike; label: string; value: string } | false, i, arr) => item && (
            <div key={item.label} className={`px-5 py-4 flex items-center gap-3 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
              <item.icon className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Status de aprovação ─────────────────────────────── */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Status da conta</p>
        {isApproved ? (
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Entregador ativo</p>
              <p className="text-xs text-muted-foreground">Seus dados estão cadastrados e você pode receber corridas</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Dados incompletos</p>
              <p className="text-xs text-muted-foreground">Preencha seus dados de veículo e CNH para ativar sua conta</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Ações ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <button onClick={() => navigate("/entregador/painel")}
          className="w-full py-3 rounded-2xl gradient-brand text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2">
          <Bike className="w-4 h-4" /> Ver corridas disponíveis
        </button>
        <button onClick={logout}
          className="w-full py-3 rounded-2xl border border-destructive/30 text-destructive font-semibold text-sm flex items-center justify-center gap-2 hover:bg-destructive/5 transition-colors">
          <LogOut className="w-4 h-4" /> Sair da conta
        </button>
      </div>
    </div>
  );
};

export default CourierProfile;
