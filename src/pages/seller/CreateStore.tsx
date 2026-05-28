import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePicker } from "@/components/ImagePicker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const categories = ["mercado", "construcao", "ferramentas", "limpeza", "farmacia", "papelaria", "eletronicos", "roupas", "outro"];

const CreateStore = () => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("outro");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("extras").eq("id", user.id).maybeSingle().then(({ data }) => {
      const extras = (data?.extras as Record<string, string>) || {};
      if (extras.storeName) setName(extras.storeName);
      if (extras.storeDescription) setDesc(extras.storeDescription);
      if (extras.storeCategory) setCat(extras.storeCategory);
      if (extras.storeImage) setImage(extras.storeImage);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    if (!name.trim()) { toast.error("Informe o nome da loja"); return; }
    if (name.trim().length < 3) { toast.error("Nome da loja deve ter pelo menos 3 caracteres"); return; }
    setBusy(true);
    try {
      const { data } = await supabase.from("profiles").select("extras").eq("id", user.id).maybeSingle();
      const extras = { ...((data?.extras as Record<string, string>) || {}), storeName: name, storeDescription: desc, storeCategory: cat, storeImage: image };
      const { error } = await supabase.from("profiles").update({ extras }).eq("id", user.id);
      if (error) throw error;
      toast.success("Loja criada!");
      navigate("/lojista/painel");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-6">Criar minha loja</h1>

      <div className="bg-card rounded-2xl p-6 shadow-card space-y-5">
        <ImagePicker value={image} onChange={setImage} folder="store" shape="rect" label="Adicionar foto da loja" />

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome da loja</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Descrição</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            className="w-full mt-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categoria</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`py-2.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  cat === c ? "gradient-brand text-primary-foreground shadow-card" : "bg-muted hover:bg-muted/70"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={save}
          disabled={busy}
          className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow disabled:opacity-60"
        >
          {busy ? "Salvando..." : "Criar loja e continuar"}
        </button>
      </div>
    </div>
  );
};

export default CreateStore;
