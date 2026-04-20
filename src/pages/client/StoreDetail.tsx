import { Link, useNavigate, useParams } from "react-router-dom";
import { Star, Clock, MapPin, Plus } from "lucide-react";
import { products, stores } from "@/data/mockData";
import { TopBar } from "@/components/TopBar";
import { useCart } from "@/context/CartContext";

const StoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = stores.find((s) => s.id === id);
  const { add, count } = useCart();

  if (!store) {
    return (
      <div className="p-8 text-center">
        <p>Loja não encontrada.</p>
        <button onClick={() => navigate(-1)} className="text-primary mt-2">Voltar</button>
      </div>
    );
  }

  const storeProducts = products.filter((p) => p.storeId === store.id);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-24">
        <div className="relative">
          <img src={store.image} alt={store.name} className="w-full h-44 object-cover" />
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 size-10 rounded-full bg-background/90 backdrop-blur flex items-center justify-center shadow-card"
          >
            ←
          </button>
        </div>

        <div className="px-5 py-4 -mt-6 relative bg-background rounded-t-3xl">
          <h1 className="text-xl font-extrabold">{store.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{store.description}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
            <span className="bg-accent text-accent-foreground px-2 py-1 rounded-md font-bold flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" /> {store.rating} ({store.reviews})
            </span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {store.distance}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {store.deliveryTime}</span>
          </div>
        </div>

        <div className="px-5 mt-3">
          <h2 className="text-base font-bold mb-3">Produtos</h2>
          <div className="space-y-2">
            {storeProducts.map((p) => (
              <div key={p.id} className="bg-card rounded-2xl p-3 shadow-card flex items-center gap-3">
                <Link to={`/cliente/produto/${p.id}`} className="flex-1 flex items-center gap-3 min-w-0">
                  <div className="size-14 rounded-xl bg-accent flex items-center justify-center text-3xl shrink-0">
                    {p.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold leading-tight line-clamp-1">{p.name}</h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{p.description}</p>
                    <p className="text-sm font-extrabold text-primary mt-1">R$ {p.price.toFixed(2)}</p>
                  </div>
                </Link>
                <button
                  onClick={() => add(p)}
                  className="size-9 rounded-full gradient-brand text-primary-foreground flex items-center justify-center shadow-card active:scale-90 transition-transform"
                  aria-label="Adicionar"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {count > 0 && (
        <button
          onClick={() => navigate("/cliente/carrinho")}
          className="absolute bottom-5 left-5 right-5 gradient-brand text-primary-foreground rounded-2xl py-4 font-bold shadow-elevated flex items-center justify-between px-5 animate-slide-up"
        >
          <span className="bg-white/25 px-2.5 py-1 rounded-lg text-xs">{count}</span>
          <span>Ver carrinho</span>
          <span>→</span>
        </button>
      )}
    </div>
  );
};

export default StoreDetail;
