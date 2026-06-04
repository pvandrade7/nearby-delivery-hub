import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Store, UserRound, ArrowLeft } from "lucide-react";
import { ImagePicker } from "@/components/ImagePicker";
import { SELLER_CATEGORIES } from "@/data/sellerCategories";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logAudit } from "@/lib/auditLog";
import { productSchema, firstError } from "@/schemas";
import { toast } from "sonner";

const NewProduct = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const isEditing = Boolean(editId);

  const [name,       setName]       = useState("");
  const [price,      setPrice]      = useState("");
  const [desc,       setDesc]       = useState("");
  const [cat,        setCat]        = useState("");
  const [image,      setImage]      = useState("");
  const [sellerKind, setSellerKind] = useState<"store" | "individual">("store");
  const [busy,       setBusy]       = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEditing);

  // Carrega produto existente para edição
  useEffect(() => {
    if (!editId || !user) return;
    (async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", editId)
        .eq("seller_id", user.id)
        .maybeSingle();

      if (error || !data) {
        toast.error("Produto não encontrado");
        navigate("/lojista/produtos");
        return;
      }
      setName(data.name ?? "");
      setPrice(data.price?.toString() ?? "");
      setDesc(data.description ?? "");
      setCat(data.category ?? "");
      setImage(data.image ?? "");
      setSellerKind((data.seller_kind as "store" | "individual") ?? "store");
      setLoadingEdit(false);
    })();
  }, [editId, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const parsePrice = (raw: string) => {
    const clean = raw.replace(",", ".").replace(/[^0-9.]/g, "");
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  };

  const validate = () => {
    const result = productSchema.safeParse({
      name:        name.trim(),
      priceStr:    price.trim(),
      description: desc.trim(),
      category:    cat,
    });
    if (!result.success) {
      toast.error(firstError(result.error));
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate() || !user) return;
    setBusy(true);

    const priceNum = parsePrice(price)!;
    const payload = {
      seller_id: user.id,
      name: name.trim(),
      description: desc.trim(),
      price: priceNum,
      category: cat,
      image: image || "",
      seller_kind: sellerKind,
      active: true,
    };

    let error;
    if (isEditing && editId) {
      ({ error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editId)
        .eq("seller_id", user.id));
    } else {
      ({ error } = await supabase.from("products").insert(payload));
    }

    if (error) {
      toast.error("Erro ao salvar produto. Tente novamente.");
    } else {
      void logAudit(
        isEditing ? "product_updated" : "product_created",
        "product",
        editId ?? undefined,
        { name: name.trim(), price: priceNum, category: cat, seller_kind: sellerKind }
      );
      toast.success(isEditing ? "Produto atualizado!" : sellerKind === "store" ? "Produto cadastrado!" : "Anúncio publicado!");
      navigate("/lojista/produtos");
    }
    setBusy(false);
  };

  if (loadingEdit) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/lojista/produtos")}
          className="size-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl lg:text-3xl font-extrabold">
          {isEditing ? "Editar produto" : sellerKind === "store" ? "Novo produto" : "Novo anúncio"}
        </h1>
      </div>

      <div className="bg-card rounded-2xl p-6 shadow-card space-y-6">

        {/* Tipo de anúncio */}
        {!isEditing && (
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Tipo de anúncio
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => setSellerKind("store")}
                className={`rounded-xl border p-4 text-left transition-all ${
                  sellerKind === "store" ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-muted"
                }`}
              >
                <Store className="w-5 h-5 text-primary mb-2" />
                <p className="text-sm font-extrabold">Loja oficial</p>
                <p className="text-xs text-muted-foreground mt-1">Produto vendido por comércio com selo.</p>
              </button>
              <button
                type="button"
                onClick={() => setSellerKind("individual")}
                className={`rounded-xl border p-4 text-left transition-all ${
                  sellerKind === "individual" ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-muted"
                }`}
              >
                <UserRound className="w-5 h-5 text-primary mb-2" />
                <p className="text-sm font-extrabold">Pessoa física</p>
                <p className="text-xs text-muted-foreground mt-1">Item usado ou ocasional, sem selo.</p>
              </button>
            </div>
          </div>
        )}

        {/* Foto do produto */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
            Foto do produto
          </label>
          <ImagePicker
            value={image}
            onChange={setImage}
            folder="product"
            shape="rect"
            label="Adicionar foto do produto"
          />
        </div>

        {/* Nome e preço */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Nome <span className="text-destructive">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={sellerKind === "store" ? "Ex: Fone Bluetooth Pro" : "Ex: Notebook Dell usado"}
              maxLength={120}
              className="w-full mt-1 bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Preço <span className="text-destructive">*</span>
            </label>
            <div className="mt-1 bg-background border border-border rounded-xl px-4 py-3 flex items-center gap-2 focus-within:ring-2 focus-within:ring-primary/30">
              <span className="text-sm font-bold text-muted-foreground">R$</span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9,.]/g, ""))}
                placeholder="0,00"
                inputMode="decimal"
                maxLength={12}
                className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Descrição <span className="text-destructive">*</span>
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            maxLength={600}
            placeholder={
              sellerKind === "store"
                ? "Descreva o produto, especificações e diferenciais..."
                : "Informe o estado de conservação, tempo de uso e forma de retirada..."
            }
            className="w-full mt-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <p className="text-xs text-muted-foreground text-right mt-1">{desc.length}/600</p>
        </div>

        {/* Categoria */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Categoria <span className="text-destructive">*</span>
          </label>
          <div className="flex flex-wrap gap-2 mt-2 max-h-44 overflow-y-auto pr-1">
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
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy ? "Salvando..." : isEditing ? "Salvar alterações" : sellerKind === "store" ? "Salvar produto" : "Publicar anúncio"}
          {!busy && <CheckCircle2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default NewProduct;
