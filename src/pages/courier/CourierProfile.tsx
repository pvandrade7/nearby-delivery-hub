import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Pencil, Check, X, Bike, MapPin, Star, Wallet, Clock } from "lucide-react";
import { ImagePicker } from "@/components/ImagePicker";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CourierProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [vehicle, setVehicle] = useState("");
  const [region,  setRegion]  = useState("");
  const [document, setDocument] = useState("");
  const [avatar,  setAvatar]  = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", vehicle: "", region: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, phone, avatar_url, extras")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("[CourierProfile] load:", error);
        if (data) {
          const ext = (data.extras as Record<string, string>) || {};
          setName(data.display_name || "");
          setPhone(data.phone || "");
          setAvatar(data.avatar_url || "");
          setVehicle(ext.vehicle || "");
          setRegion(ext.region || "");
          setDocument(ext.document || "");
        }
        setLoading(false);
      });
  }, [user]);

  const openEdit = () => {
    setForm({ name, phone, vehicle, region });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!user) return;
    if (!form.name.trim()) { toast.error("Nome não pode ficar em branco"); return; }
    setSaving(true);

    const { data: cur } = await supabase
      .from("profiles")
      .select("extras")
      .eq("id", user.id)
      .maybeSingle();

    const extras = {
      ...((cur?.extras as Record<string, string>) || {}),
      vehicle: form.vehicle,
      region: form.region,
    };

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: form.name.trim(),
        phone: form.phone.trim() || null,
        extras,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Falha ao salvar dados");
    } else {
      setName(form.name.trim());
      setPhone(form.phone.trim());
      setVehicle(form.vehicle);
      setRegion(form.region);
      toast.success("Perfil atualizado!");
      setEditing(false);
    }
    setSaving(false);
  };

  const onAvatar = async (url: string) => {
    setAvatar(url);
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", user.id);
    if (error) toast.error("Falha ao atualizar foto");
    else toast.success("Foto atualizada!");
  };

  const logout = async () => {
    await signOut();
    navigate("/entregador", { replace: true });
  };

  const displayName = name || user?.email?.split("@")[0] || "Entregador";

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-6">Meu perfil</h1>

      {/* Card do entregador */}
      <div className="bg-card rounded-2xl p-5 shadow-card mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 shrink-0">
            {loading ? (
              <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            ) : (
              <ImagePicker value={avatar} onChange={onAvatar} folder="avatar" shape="circle" label="Foto" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-2">
                <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                <div className="h-3 w-44 bg-muted rounded animate-pulse" />
              </div>
            ) : (
              <>
                <p className="font-bold text-lg leading-tight truncate">{displayName}</p>
                <p className="text-sm text-muted-foreground truncate">{phone || user?.email || ""}</p>
              </>
            )}
          </div>
          {!loading && !editing && (
            <button
              onClick={openEdit}
              className="shrink-0 p-2 rounded-xl hover:bg-muted/50 transition-colors"
              aria-label="Editar perfil"
            >
              <Pencil className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Edição inline */}
        {editing && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Nome</label>
              <input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full bg-muted rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Telefone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                className="mt-1 w-full bg-muted rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="(00) 9 0000-0000"
                inputMode="tel"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Veículo</label>
              <input
                value={form.vehicle}
                onChange={(e) => setForm(f => ({ ...f, vehicle: e.target.value }))}
                className="mt-1 w-full bg-muted rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Ex: Moto, Bicicleta, Carro"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Região de atuação</label>
              <input
                value={form.region}
                onChange={(e) => setForm(f => ({ ...f, region: e.target.value }))}
                className="mt-1 w-full bg-muted rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Ex: Centro, Vila Nova..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 gradient-brand text-primary-foreground rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Check className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar"}
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="px-4 border border-border rounded-xl font-bold text-sm hover:bg-muted/40 disabled:opacity-60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { icon: Wallet, label: "Saldo", value: "R$ 142,80", color: "text-primary", bg: "bg-primary/10" },
          { icon: Star,   label: "Avaliação", value: "4.9 ⭐", color: "text-warning", bg: "bg-warning/15" },
          { icon: Clock,  label: "Entregas", value: "8 hoje", color: "text-success", bg: "bg-success/15" },
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

      {/* Info do veículo e região */}
      {!loading && !editing && (vehicle || region || document) && (
        <div className="bg-card rounded-2xl shadow-card overflow-hidden mb-4">
          {vehicle && (
            <div className="px-5 py-4 flex items-center gap-3 border-b border-border">
              <Bike className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Veículo</p>
                <p className="text-sm font-semibold">{vehicle}</p>
              </div>
            </div>
          )}
          {region && (
            <div className="px-5 py-4 flex items-center gap-3 border-b border-border">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Região de atuação</p>
                <p className="text-sm font-semibold">{region}</p>
              </div>
            </div>
          )}
          {document && (
            <div className="px-5 py-4 flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center text-primary text-xs font-bold shrink-0">ID</div>
              <div>
                <p className="text-xs text-muted-foreground">Documento</p>
                <p className="text-sm font-semibold">{document}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ações */}
      <div className="space-y-3">
        <button
          onClick={() => navigate("/entregador/painel")}
          className="w-full py-3 rounded-2xl gradient-brand text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2"
        >
          <Bike className="w-4 h-4" /> Ver corridas disponíveis
        </button>
        <button
          onClick={logout}
          className="w-full py-3 rounded-2xl border border-destructive/30 text-destructive font-semibold text-sm flex items-center justify-center gap-2 hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sair da conta
        </button>
      </div>
    </div>
  );
};

export default CourierProfile;
