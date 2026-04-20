import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, Star, ChevronRight, Bell, Tag } from "lucide-react";
import { categories, stores, products } from "@/data/mockData";
import { ClientTabBar } from "@/components/ClientTabBar";

const ClientHome = () => {
  const navigate = useNavigate();

  const popular = products.filter((p) => p.popular).slice(0, 6);
  const onSale = products.filter((p) => p.onSale).slice(0, 6);
  const nearbyStores = stores.slice(0, 4);

  const storeOf = (storeId: string) => stores.find((s) => s.id === storeId);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide pb-2 bg-background">
      {/* Header */}
      <header className="gradient-brand text-primary-foreground px-5 pt-5 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Entregar em</p>
              <p className="text-sm font-bold truncate">Rua das Flores, 200</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="size-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </button>
            <Link
              to="/"
              className="size-9 rounded-full bg-white/25 backdrop-blur flex items-center justify-center font-bold text-sm"
            >
              J
            </Link>
          </div>
        </div>

        <button
          onClick={() => navigate("/cliente/busca")}
          className="w-full bg-background text-muted-foreground rounded-xl px-4 py-3 flex items-center gap-3 shadow-card text-left"
        >
          <Search className="w-5 h-5 text-primary" />
          <span className="text-sm">Buscar produtos ou lojas</span>
        </button>
      </header>

      {/* Categories */}
      <section className="px-5 pt-5">
        <div className="grid grid-cols-5 gap-x-2 gap-y-4">
          {categories.slice(0, 10).map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/cliente/busca?cat=${cat.id}`)}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
              <div className="size-12 rounded-xl bg-accent flex items-center justify-center text-2xl shadow-card">
                {cat.emoji}
              </div>
              <span className="text-[10px] font-semibold text-center leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Promo banner */}
      <div className="mx-5 mt-5 bg-gradient-to-r from-secondary to-primary rounded-2xl p-4 text-primary-foreground flex justify-between items-center shadow-card">
        <div>
          <p className="text-[11px] opacity-90 font-semibold uppercase tracking-wider">Frete grátis 🚚</p>
          <p className="font-bold text-base leading-tight mt-0.5">Em compras acima de R$ 50</p>
        </div>
        <span className="text-3xl">🎁</span>
      </div>

      {/* Ofertas da semana */}
      <section className="mt-6">
        <div className="flex justify-between items-center mb-3 px-5">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-secondary" />
            <h2 className="text-base font-bold">Ofertas da semana</h2>
          </div>
          <Link to="/cliente/busca" className="text-xs text-primary font-semibold flex items-center gap-0.5">
            Ver mais <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 px-5 scrollbar-hide">
          {onSale.map((p) => {
            const store = storeOf(p.storeId);
            const off = p.originalPrice
              ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
              : 0;
            return (
              <Link
                key={p.id}
                to={`/cliente/produto/${p.id}`}
                className="bg-card rounded-2xl shadow-card overflow-hidden min-w-[150px] max-w-[150px] active:scale-[0.98] transition-transform"
              >
                <div className="relative aspect-square bg-muted">
                  <img src={p.image} alt={p.name} loading="lazy" width={300} height={300} className="w-full h-full object-cover" />
                  {off > 0 && (
                    <span className="absolute top-2 left-2 bg-secondary text-secondary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md">
                      -{off}%
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold leading-tight line-clamp-2 min-h-[28px]">{p.name}</p>
                  {p.originalPrice && (
                    <p className="text-[10px] text-muted-foreground line-through mt-1">R$ {p.originalPrice.toFixed(2)}</p>
                  )}
                  <p className="text-sm font-extrabold text-primary leading-none">R$ {p.price.toFixed(2)}</p>
                  {store && (
                    <p className="text-[10px] text-muted-foreground mt-1 truncate flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-warning text-warning" /> {store.rating} • {store.name}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Produtos populares */}
      <section className="mt-6 px-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-bold">Produtos populares</h2>
          <Link to="/cliente/busca" className="text-xs text-primary font-semibold flex items-center gap-0.5">
            Ver mais <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {popular.map((p) => {
            const store = storeOf(p.storeId);
            return (
              <Link
                key={p.id}
                to={`/cliente/produto/${p.id}`}
                className="bg-card rounded-2xl shadow-card overflow-hidden active:scale-[0.98] transition-transform"
              >
                <div className="aspect-square bg-muted">
                  <img src={p.image} alt={p.name} loading="lazy" width={300} height={300} className="w-full h-full object-cover" />
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold leading-tight line-clamp-2 min-h-[28px]">{p.name}</p>
                  <p className="text-sm font-extrabold text-primary mt-1">R$ {p.price.toFixed(2)}</p>
                  {store && (
                    <p className="text-[10px] text-muted-foreground mt-1 truncate flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-warning text-warning" /> {store.rating} • {store.name}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Lojas pertinho */}
      <section className="mt-6 px-5 pb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-bold">Lojas pertinho</h2>
          <Link to="/cliente/lojas" className="text-xs text-primary font-semibold flex items-center gap-0.5">
            Ver todas <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {nearbyStores.map((store) => (
            <Link
              key={store.id}
              to={`/cliente/loja/${store.id}`}
              className="bg-card rounded-2xl p-3 shadow-card flex gap-3 items-center active:scale-[0.99] transition-transform"
            >
              <img
                src={store.image}
                alt={store.name}
                loading="lazy"
                width={64}
                height={64}
                className="size-14 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold truncate">{store.name}</h3>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{store.description}</p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                  <span className="flex items-center gap-0.5 font-semibold text-foreground">
                    <Star className="w-2.5 h-2.5 fill-warning text-warning" /> {store.rating}
                  </span>
                  <span>•</span>
                  <span>{store.distance}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      <ClientTabBar />
    </div>
  );
};

export default ClientHome;
