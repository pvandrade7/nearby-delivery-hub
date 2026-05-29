import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Store, UserRound } from "lucide-react";
import { ImagePicker } from "@/components/ImagePicker";
import { SELLER_CATEGORIES } from "@/data/sellerCategories";
import { toast } from "sonner";

const NewProduct = () => {
  const navigate = useNavigate();
  const [name,       setName]       = useState("");
  const [price,      setPrice]      = useState("");
  const [desc,       setDesc]       = useState("");
  const [cat,        setCat]        = useState("");
  const [image,      setImage]      = useState("");
  const [sellerKind, setSellerKind] = useState<"store" | "individual">("store");
  const [busy,       setBusy]       = useState(false);

  const parsePrice = (raw: string) => {
    const clean = raw.replace(",", ".").replace(/[^0-9.]/g, "");
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  };

  const validate = () => {
    if (!name.trim()) {
      toast.error("Informe o nome do produto.");
      return false;
    }
    if (name.trim().length < 2) {
      toast.error("O nome deve ter pelo menos 2 caracteres.");
      return false;
    }
    const priceNum = parsePrice(price);
    if (!price.trim()) {
      toast.error("Informe o preço do produto.");
      return false;
    }
    if (priceNum === null || priceNum <= 0) {
      toast.error("Informe um preço válido maior que zero.");
      return false;
    }
    if (!cat) {
      toast.error("Selecione uma categoria para o produto.");
      return false;
    }
    if (!desc.trim()) {
      toast.error("Adicione uma descrição ao produto.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setBusy(true);
    // Protótipo: simula persistência com delay
    await new Promise((r) => setTimeout(r, 600));
    toast.success(sellerKind === "store" ? "Produto cadastrado!" : "Anúncio publicado!");
    navigate("/lojista/produtos");
    setBusy(false);
  };

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-6">
        {sellerKind === "store" ? "Novo produto" : "Novo anúncio"}
      </h1>

      <div className="bg-card rounded-2xl p-6 shadow-card space-y-6">

        {/* Tipo de anúncio */}
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Tipo de anúncio
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <button
              type="button"
              onClick={() => setSellerKind("store")}
              className={`rounded-xl border p-4 text-left transition-all ${
                sellerKind === "store"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:bg-muted"
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
                sellerKind === "individual"
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              <UserRound className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-extrabold">Pessoa física</p>
              <p className="text-xs text-muted-foreground mt-1">Item usado ou ocasional, sem selo.</p>
            </button>
          </div>
        </div>

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
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9,.]/g, "");
                  setPrice(raw);
                }}
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
          {busy
            ? "Salvando..."
            : sellerKind === "store"
              ? "Salvar produto"
              : "Publicar anúncio"}
          {!busy && <CheckCircle2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default NewProduct;
