import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, MapPin, CreditCard, Heart, HelpCircle, LogOut } from "lucide-react";
import { ImagePicker } from "@/components/ImagePicker";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const items = [
  { icon: MapPin, label: "Endereços salvos" },
  { icon: CreditCard, label: "Formas de pagamento" },
  { icon: Heart, label: "Favoritos" },
  { icon: HelpCircle, label: "Ajuda" },
];

const ClientProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, phone, avatar_url").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setName(data.display_name || "");
        setPhone(data.phone || "");
        setAvatar(data.avatar_url || "");
      }
    });
  }, [user]);

  const onAvatar = async (url: string) => {
    setAvatar(url);
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    if (error) toast.error("Falha ao atualizar foto");
  };

  const logout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-6">Meu perfil</h1>

      <div className="bg-card rounded-2xl p-5 shadow-card flex items-center gap-4">
        <div className="w-16">
          <ImagePicker value={avatar} onChange={onAvatar} folder="avatar" shape="circle" label="Foto" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg">{name || "Sem nome"}</p>
          <p className="text-sm text-muted-foreground">{phone || user?.email}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl mt-4 shadow-card overflow-hidden">
        {items.map((it) => (
          <button key={it.label} className="w-full px-5 py-4 flex items-center gap-3 border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
            <it.icon className="w-5 h-5 text-primary" />
            <span className="flex-1 text-left text-sm font-semibold">{it.label}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <button onClick={logout} className="w-full mt-4 py-3 text-destructive font-semibold text-sm flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4" /> Sair
      </button>
    </div>
  );
};

export default ClientProfile;
