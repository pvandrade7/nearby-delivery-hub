import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { products } from "@/data/mockData";

const SellerProducts = () => {
  const items = products.filter((p) => p.storeId === "s3");

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold">Meus produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.length} produtos cadastrados</p>
        </div>
        <Link
          to="/lojista/produtos/novo"
          className="inline-flex items-center gap-2 gradient-brand text-primary-foreground rounded-xl px-5 py-2.5 font-bold shadow-card hover:shadow-elevated transition-shadow"
        >
          <Plus className="w-4 h-4" /> Novo produto
        </Link>
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-bold px-5 lg:px-6 py-3">Produto</th>
                <th className="text-left font-bold px-3 py-3 hidden md:table-cell">Categoria</th>
                <th className="text-right font-bold px-3 py-3">Preço</th>
                <th className="text-right font-bold px-5 lg:px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-5 lg:px-6 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} loading="lazy" className="size-12 rounded-lg object-cover bg-muted" />
                      <div>
                        <p className="font-bold">{p.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground capitalize hidden md:table-cell">{p.category}</td>
                  <td className="px-3 py-3 font-extrabold text-primary text-right">R$ {p.price.toFixed(2)}</td>
                  <td className="px-5 lg:px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="size-9 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center" aria-label="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button className="size-9 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center" aria-label="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerProducts;
