import { Link, useNavigate, useParams } from "react-router-dom";
import { Star, Clock, MapPin, Plus, ArrowLeft, Heart } from "lucide-react";
import { products, stores, categories } from "@/data/mockData";
import type { Logistica } from "@/data/mockData";
import { useCart } from "@/context/CartContext";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { StoreLogo } from "@/components/StoreLogo";
import { useFavorite } from "@/hooks/useFavorite";
import { ENTREGA_ICON, ENTREGA_LABEL, ENTREGA_COLOR } from "@/lib/logistica";

const EntregaBadge = ({ log }: { log: Logistica | undefined }) => {
  if (!log) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1.5 ${ENTREGA_COLOR[log.entrega]}`}>
      {ENTREGA_ICON[log.entrega]} {ENTREGA_LABEL[log.entrega]}
    </span>
  );
};

const StoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = stores.find((s) => s.id === id);
  const { add, count } = useCart();

  const cat = categories.find((c) => c.id === store?.category);

  const { favorited, toggle, loading: favLoading } = useFavorite(
    store
      ? { id: store.id, name: store.name, image: store.image, category: cat?.name ?? store.category }
      : { id: "", name: "" }
  );

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

      {/* Hero — banner de capa */}
      <div className="bg-card rounded-2xl shadow-card mb-6">
        <div className="h-36 lg:h-48 relative overflow-hidden rounded-t-2xl">
          <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
          {/* Gradiente inferior para legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Botão favoritar */}
          <button
            onClick={toggle}
            disabled={favLoading}
            aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            className={`absolute top-3 right-3 size-11 rounded-full backdrop-blur-sm flex items-center justify-center shadow-elevated transition-all active:scale-90 ${
              favorited ? "bg-red-500 text-white" : "bg-black/30 text-white hover:bg-black/50"
            }`}
          >
            <Heart className={`w-5 h-5 ${favorited ? "fill-white" : ""} ${favLoading ? "opacity-50" : ""}`} />
          </button>
        </div>

        {/* Identidade visual: logo + nome + badges */}
        <div className="px-5 lg:px-6 pt-0 pb-5 lg:pb-6">
          {/* Logo sobreposto ao banner */}
          <div className="flex items-end justify-between gap-4 -mt-8 mb-3 relative z-10">
            <div className="ring-4 ring-card rounded-xl shadow-elevated">
              <StoreLogo store={store} size="xl" whiteBg />
            </div>
            {/* Favoritar (desktop) */}
            <button
              onClick={toggle}
              disabled={favLoading}
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${
                favorited
                  ? "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-500"
                  : "border-border bg-background hover:border-red-300 hover:text-red-400 text-muted-foreground"
              }`}
            >
              <Heart className={`w-4 h-4 ${favorited ? "fill-red-500 text-red-500" : ""}`} />
              {favorited ? "Favoritada" : "Favoritar"}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl lg:text-3xl font-extrabold">{store.name}</h1>
            {store.verificationStatus === "verificado" && <VerifiedBadge />}
            {store.isLocal && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                🏪 Comércio local
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground">{store.description}</p>
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
              <EntregaBadge log={p.logistica} />
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
