import { Link, useNavigate, useParams } from "react-router-dom";
import { Star, Clock, MapPin, Plus, ArrowLeft } from "lucide-react";
import { products, stores } from "@/data/mockData";
import { useCart } from "@/context/CartContext";
import { VerifiedBadge } from "@/components/VerifiedBadge";

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
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      {/* Hero */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden mb-6">
        <div className="h-44 lg:h-56 relative">
          <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
        </div>
        <div className="p-5 lg:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold">{store.name}</h1>
            {store.verificationStatus === "verificado" && <VerifiedBadge />}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{store.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-3">
            <span className="bg-accent text-accent-foreground px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" /> {store.rating} ({store.reviews})
            </span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {store.distance}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {store.deliveryTime}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold">Produtos da loja</h2>
        {count > 0 && (
          <button
            onClick={() => navigate("/cliente/carrinho")}
            className="gradient-brand text-primary-foreground rounded-xl px-4 py-2 font-bold shadow-card text-sm flex items-center gap-2"
          >
            <span className="bg-white/25 px-2 py-0.5 rounded text-xs">{count}</span>
            Ver carrinho
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {storeProducts.map((p) => (
          <div key={p.id} className="bg-card rounded-2xl shadow-card overflow-hidden flex flex-col hover:shadow-elevated transition-all">
            <Link to={`/cliente/produto/${p.id}`} className="block">
              <div className="aspect-square bg-muted">
                <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
              </div>
            </Link>
            <div className="p-3 flex-1 flex flex-col">
              <Link to={`/cliente/produto/${p.id}`}>
                <p className="text-sm font-semibold leading-tight line-clamp-2 min-h-[40px]">{p.name}</p>
              </Link>
              {p.originalPrice && (
                <p className="text-xs text-muted-foreground line-through mt-1">R$ {p.originalPrice.toFixed(2)}</p>
              )}
              <p className="text-base font-extrabold text-primary">R$ {p.price.toFixed(2)}</p>
              <button
                onClick={() => add(p)}
                className="mt-3 gradient-brand text-primary-foreground rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-1 hover:shadow-card transition-shadow"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreDetail;
