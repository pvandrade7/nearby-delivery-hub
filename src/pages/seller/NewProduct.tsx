import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { TopBar } from "@/components/TopBar";

const NewProduct = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("padaria");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Novo produto" />
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-5 space-y-4">
        <button className="w-full aspect-square max-h-48 rounded-2xl gradient-warm flex flex-col items-center justify-center gap-2 text-muted-foreground border-2 border-dashed border-border">
          <Camera className="w-8 h-8" />
          <span className="text-xs font-semibold">Adicionar foto do produto</span>
        </button>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Pão de queijo"
            className="w-full mt-1 bg-muted rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Preço</label>
          <div className="mt-1 bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
            <span className="text-sm font-bold text-muted-foreground">R$</span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Descrição</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            placeholder="Conte sobre seu produto"
            className="w-full mt-1 bg-muted rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categoria</label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {["padaria", "mercado", "açougue", "flores", "farmácia", "comida"].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`py-2.5 rounded-xl text-xs font-bold capitalize ${
                  cat === c ? "gradient-brand text-primary-foreground shadow-card" : "bg-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-border">
        <button
          onClick={() => navigate("/lojista/produtos")}
          className="w-full gradient-brand text-primary-foreground rounded-2xl py-4 font-bold shadow-elevated"
        >
          Salvar produto
        </button>
      </div>
    </div>
  );
};

export default NewProduct;
