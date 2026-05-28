import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, MapPin, CreditCard, Heart, HelpCircle, LogOut, Pencil, Check, X } from "lucide-react";
import { ImagePicker } from "@/components/ImagePicker";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const items = [
  { icon: MapPin,     label: "Endereços salvos",    path: "/cliente/enderecos" },
  { icon: CreditCard, label: "Formas de pagamento", path: "/cliente/pagamento" },
  { icon: Heart,      label: "Favoritos",            path: "/cliente/favoritos" },
  { icon: HelpCircle, label: "Ajuda",                path: "/cliente/ajuda" },
];

const ClientProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("");
  const [avatar,  setAvatar]  = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName,  setEditName]  = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, phone, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("[ClientProfile] load:", error);
        if (data) {
          setName(data.display_name || "");
          setPhone(data.phone || "");
          setAvatar(data.avatar_url || "");
        }
        setLoading(false);
      });
  }, [user]);

  const openEdit = () => {
    setEditName(name);
    setEditPhone(phone);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!user) return;
    if (!editName.trim()) { toast.error("Nome não pode ficar em branco"); return; }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: editName.trim(), phone: editPhone.trim() || null })
      .eq("id", user.id);
    if (error) {
      toast.error("Falha ao salvar dados");
    } else {
      setName(editName.trim());
      setPhone(editPhone.trim());
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
    navigate("/cliente", { replace: true });
  };

  const displayName = name || user?.email?.split("@")[0] || "Usuário";
  const displaySub  = phone || user?.email || "";

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-6">Meu perfil</h1>

      {/* Card do usuário */}
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
                <p className="text-sm text-muted-foreground truncate">{displaySub}</p>
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

        {/* Formulário de edição inline */}
        {editing && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Nome</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 w-full bg-muted rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Telefone</label>
              <input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="mt-1 w-full bg-muted rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="(00) 9 0000-0000"
                inputMode="tel"
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

      {/* Menu de navegação */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden mb-4">
        {items.map((it) => (
          <button
            key={it.label}
            onClick={() => navigate(it.path)}
            className="w-full px-5 py-4 flex items-center gap-3 border-b border-border last:border-0 hover:bg-muted/40 active:bg-muted/60 transition-colors"
          >
            <it.icon className="w-5 h-5 text-primary shrink-0" />
            <span className="flex-1 text-left text-sm font-semibold">{it.label}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <button
        onClick={logout}
        className="w-full py-3 rounded-2xl border border-destructive/30 text-destructive font-semibold text-sm flex items-center justify-center gap-2 hover:bg-destructive/5 transition-colors"
      >
        <LogOut className="w-4 h-4" /> Sair da conta
      </button>
    </div>
  );
};

export default ClientProfile;
