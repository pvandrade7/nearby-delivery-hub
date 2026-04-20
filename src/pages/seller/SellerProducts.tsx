import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { SellerTabBar } from "@/components/SellerTabBar";
import { products } from "@/data/mockData";

const SellerProducts = () => {
  const items = products.filter((p) => p.storeId === "s3");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar
        title="Meus produtos"
        right={
          <Link to="/lojista/produtos/novo" className="size-9 rounded-full gradient-brand text-primary-foreground flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </Link>
        }
      />
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 space-y-3">
        {items.map((p) => (
          <div key={p.id} className="bg-card rounded-2xl p-3 shadow-card flex items-center gap-3">
            <img src={p.image} alt={p.name} loading="lazy" width={56} height={56} className="size-14 rounded-xl object-cover bg-muted" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm line-clamp-1">{p.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
              <p className="text-sm font-extrabold text-primary mt-1">R$ {p.price.toFixed(2)}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <button className="size-8 rounded-lg bg-muted flex items-center justify-center">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button className="size-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <SellerTabBar />
    </div>
  );
};

export default SellerProducts;
