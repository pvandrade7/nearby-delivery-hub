import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";

const CreateStore = () => {
  const [name, setName] = useState("Ferragens do Bairro");
  const [desc, setDesc] = useState("Ferramentas, parafusos e acessórios para reparos.");
  const [cat, setCat] = useState("ferramentas");
  const navigate = useNavigate();

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-6">Criar minha loja</h1>

      <div className="bg-card rounded-2xl p-6 shadow-card space-y-5">
        <button className="w-full aspect-[3/1] rounded-xl gradient-warm flex flex-col items-center justify-center gap-2 text-muted-foreground border-2 border-dashed border-border hover:border-primary transition-colors">
          <Camera className="w-8 h-8" />
          <span className="text-sm font-semibold">Adicionar foto da loja</span>
        </button>

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
            {["mercado", "construcao", "ferramentas", "limpeza", "farmacia", "papelaria", "eletronicos", "roupas"].map((c) => (
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
          onClick={() => navigate("/lojista/painel")}
          className="w-full gradient-brand text-primary-foreground rounded-xl py-3.5 font-bold shadow-card hover:shadow-elevated transition-shadow"
        >
          Criar loja e continuar
        </button>
      </div>
    </div>
  );
};

export default CreateStore;
