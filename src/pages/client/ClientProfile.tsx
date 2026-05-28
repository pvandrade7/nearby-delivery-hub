import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, MapPin, CreditCard, Heart, HelpCircle, LogOut, User } from "lucide-react";
import { ImagePicker } from "@/components/ImagePicker";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const items = [
  { icon: MapPin,       label: "Endereços salvos",    path: "/cliente/enderecos" },
  { icon: CreditCard,   label: "Formas de pagamento", path: "/cliente/pagamento" },
  { icon: Heart,        label: "Favoritos",            path: "/cliente/favoritos" },
  { icon: HelpCircle,   label: "Ajuda",                path: "/cliente/ajuda" },
];

const ClientProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName]     = useState("");
  const [phone, setPhone]   = useState("");
  const [avatar, setAvatar] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, phone, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setName(data.display_name || "");
          setPhone(data.phone || "");
          setAvatar(data.avatar_url || "");
        }
        setLoading(false);
      });
  }, [user]);

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
    navigate("/cliente");
  };

  const displayName = name || user?.email?.split("@")[0] || "Usuário";
  const displaySub  = phone || user?.email || "";

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-6">Meu perfil</h1>

      {/* Card do usuário */}
      <div className="bg-card rounded-2xl p-5 shadow-card flex items-center gap-4 mb-4">
        <div className="w-16 shrink-0">
          {loading ? (
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
          ) : (
            <ImagePicker
              value={avatar}
              onChange={onAvatar}
              folder="avatar"
              shape="circle"
              label="Foto"
            />
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
        <button
          onClick={() => navigate("/cliente/perfil/editar")}
          className="shrink-0 p-2 rounded-xl hover:bg-muted/50 transition-colors"
        >
          <User className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Itens do menu */}
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

      {/* Sair */}
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
