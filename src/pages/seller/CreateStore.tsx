import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePicker } from "@/components/ImagePicker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SELLER_CATEGORIES } from "@/data/sellerCategories";
import { toast } from "sonner";

const CreateStore = () => {
  const [name,  setName]  = useState("");
  const [desc,  setDesc]  = useState("");
  const [cat,   setCat]   = useState("");
  const [image, setImage] = useState("");
  const [busy,  setBusy]  = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEdit, setIsEdit] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Carrega dados existentes da loja — suporta tanto a chave nova (storeCategory)
  // quanto a antiga (category) para retrocompatibilidade.
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("extras")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const ext = (data?.extras as Record<string, string>) ?? {};
        if (ext.storeName)    setName(ext.storeName);
        if (ext.storeDescription) setDesc(ext.storeDescription);
        if (ext.storeImage)   setImage(ext.storeImage);
        // Suporta tanto "storeCategory" (atual) quanto "category" (legado)
        const category = ext.storeCategory || ext.category || "";
        if (category) setCat(category);
        // Modo edição: loja já existe com nome e categoria
        if (ext.storeName && (ext.storeCategory || ext.category)) setIsEdit(true);
        setLoadingProfile(false);
      });
  }, [user]);

  const validate = () => {
    if (!name.trim()) {
      toast.error("Informe o nome da loja.");
      return false;
    }
    if (name.trim().length < 3) {
      toast.error("O nome da loja deve ter pelo menos 3 caracteres.");
      return false;
    }
    if (!cat) {
      toast.error("Selecione uma categoria para a loja.");
      return false;
    }
    return true;
  };

  const save = async () => {
    if (!user) return;
    if (!validate()) return;
    setBusy(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("extras")
        .eq("id", user.id)
        .maybeSingle();

      const extras = {
        ...((data?.extras as Record<string, string>) ?? {}),
        storeName: name.trim(),
        storeDescription: desc.trim(),
        storeCategory: cat,
        storeImage: image,
      };

      const { error } = await supabase
        .from("profiles")
        .update({ extras })
        .eq("id", user.id);

      if (error) throw error;

      // Invalida o cache de lojas para que a loja apareça imediatamente no lado cliente
      void qc.invalidateQueries({ queryKey: ["client-stores"] });

      toast.success(isEdit ? "Loja atualizada com sucesso!" : "Loja criada com sucesso!");
      navigate("/lojista/painel");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar a loja. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto space-y-5">
        <div className="h-8 w-48 bg-muted rounded-xl animate-pulse" />
        <div className="bg-card rounded-2xl p-6 shadow-card space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              <div className="h-11 bg-muted rounded-xl animate-pulse" />
            </div>
          ))}
          <div className="h-12 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold">
            {isEdit ? "Editar minha loja" : "Criar minha loja"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEdit
              ? "Atualize os dados da sua loja."
              : "Configure sua vitrine para começar a vender."}
          </p>
        </div>
        {isEdit && (
          <button
            onClick={() => navigate("/lojista/painel")}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Ir ao painel →
          </button>
        )}
      </div>

      <div className="bg-card rounded-2xl p-6 shadow-card space-y-6">
        {/* Imagem da loja */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Foto da loja
          </p>
          <ImagePicker
            value={image}
            onChange={setImage}
            folder="store"
            shape="rect"
            label="Adicionar foto da loja"
          />
        </div>

        {/* Nome */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Nome da loja <span className="text-destructive">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Tech Zone Acessórios"
            maxLength={80}
            className="w-full mt-1 bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Descrição
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            placeholder="Conte um pouco sobre sua loja e o que você vende..."
            maxLength={400}
            className="w-full mt-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <p className="text-xs text-muted-foreground text-right mt-1">{desc.length}/400</p>
        </div>

        {/* Categoria */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Categoria <span className="text-destructive">*</span>
          </label>
          <div className="flex flex-wrap gap-2 mt-2 max-h-48 overflow-y-auto pr-1">
            {SELLER_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  cat === c
                    ? "bg-primary text-primary-foreground border-primary shadow-card"
                    : "bg-muted text-muted-foreground border-transparent hover:bg-muted/70"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {cat && (
            <p className="text-xs text-primary font-semibold flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-3 h-3" /> {cat}
            </p>
          )}
        </div>

        {/* Botão */}
        <button
          onClick={save}
          disabled={busy}
          className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy
            ? (isEdit ? "Atualizando..." : "Criando...")
            : (isEdit ? "Atualizar loja" : "Criar loja e continuar")}
          {!busy && <CheckCircle2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default CreateStore;
