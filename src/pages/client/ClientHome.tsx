import { Link, useNavigate } from "react-router-dom";
import { Star, ChevronRight, Tag, Truck, UserRound } from "lucide-react";
import { categories, stores, products, getProductSeller } from "@/data/mockData";
import { VerifiedBadge } from "@/components/VerifiedBadge";

const ClientHome = () => {
  const navigate = useNavigate();

  const popular = products.filter((p) => p.popular);
  const onSale = products.filter((p) => p.onSale);
  const usedItems = products.filter((p) => p.sellerId);
  const nearbyStores = stores.slice(0, 6);

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto space-y-8">
      {/* Hero / promo */}
      <section className="rounded-2xl gradient-brand text-primary-foreground p-6 lg:p-10 shadow-elevated flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs lg:text-sm font-bold uppercase tracking-wider opacity-90">Marketplace local</p>
          <h1 className="text-2xl lg:text-4xl font-extrabold mt-2 leading-tight">
            Compre do bairro,<br className="hidden lg:block" /> receba no mesmo dia.
          </h1>
          <p className="text-sm lg:text-base opacity-90 mt-2 max-w-lg">
            Materiais de construção, mercado, ferramentas, farmácia e muito mais — tudo perto de você.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/15 backdrop-blur rounded-2xl px-5 py-4">
          <Truck className="w-6 h-6" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider opacity-90">Frete grátis</p>
            <p className="text-sm font-bold">em compras acima de R$ 50</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Categorias</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/cliente/busca?cat=${cat.id}`)}
              className="bg-card hover:shadow-elevated transition-all rounded-2xl p-4 flex flex-col items-center gap-2 shadow-card group"
            >
              <div className="size-12 lg:size-14 rounded-xl bg-accent flex items-center justify-center text-2xl lg:text-3xl group-hover:scale-110 transition-transform">
                {cat.emoji}
              </div>
              <span className="text-xs font-semibold text-center leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Ofertas da semana */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-secondary" />
            <h2 className="text-lg lg:text-xl font-extrabold">Ofertas da semana</h2>
          </div>
          <Link to="/cliente/busca" className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">
            Ver mais <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {onSale.map((p) => {
            const seller = getProductSeller(p);
            const off = p.originalPrice
              ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
              : 0;
            return (
              <Link
                key={p.id}
                to={`/cliente/produto/${p.id}`}
                className="bg-card rounded-2xl shadow-card overflow-hidden hover:shadow-elevated hover:-translate-y-0.5 transition-all"
              >
                <div className="relative aspect-square bg-muted">
                  <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                  {off > 0 && (
                    <span className="absolute top-2 left-2 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-0.5 rounded-md">
                      -{off}%
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold leading-tight line-clamp-2 min-h-[40px]">{p.name}</p>
                  {p.originalPrice && (
                    <p className="text-xs text-muted-foreground line-through mt-1">R$ {p.originalPrice.toFixed(2)}</p>
                  )}
                  <p className="text-base font-extrabold text-primary leading-none">R$ {p.price.toFixed(2)}</p>
                  {seller && (
                    <p className="text-[11px] text-muted-foreground mt-2 truncate flex items-center gap-1">
                      {seller.type === "store" ? <Star className="w-3 h-3 fill-warning text-warning" /> : <UserRound className="w-3 h-3" />} {seller.rating} • {seller.name}
                      {seller.verified && <VerifiedBadge compact />}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Produtos populares */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg lg:text-xl font-extrabold">Produtos populares</h2>
          <Link to="/cliente/busca" className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">
            Ver mais <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {popular.map((p) => {
            const seller = getProductSeller(p);
            return (
              <Link
                key={p.id}
                to={`/cliente/produto/${p.id}`}
                className="bg-card rounded-2xl shadow-card overflow-hidden hover:shadow-elevated hover:-translate-y-0.5 transition-all"
              >
                <div className="aspect-square bg-muted">
                  <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold leading-tight line-clamp-2 min-h-[40px]">{p.name}</p>
                  <p className="text-base font-extrabold text-primary mt-1">R$ {p.price.toFixed(2)}</p>
                  {seller && (
                    <p className="text-[11px] text-muted-foreground mt-2 truncate flex items-center gap-1">
                      {seller.type === "store" ? <Star className="w-3 h-3 fill-warning text-warning" /> : <UserRound className="w-3 h-3" />} {seller.rating} • {seller.name}
                      {seller.verified && <VerifiedBadge compact />}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg lg:text-xl font-extrabold">Vendedores comuns</h2>
          <Link to="/cliente/busca?tipo=pessoa" className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">
            Ver usados <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {usedItems.map((p) => {
            const seller = getProductSeller(p);
            return (
              <Link key={p.id} to={`/cliente/produto/${p.id}`} className="bg-card rounded-2xl shadow-card overflow-hidden hover:shadow-elevated hover:-translate-y-0.5 transition-all">
                <div className="aspect-square bg-muted">
                  <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold leading-tight line-clamp-2 min-h-[40px]">{p.name}</p>
                  <p className="text-base font-extrabold text-primary mt-1">R$ {p.price.toFixed(2)}</p>
                  {seller && <p className="text-[11px] text-muted-foreground mt-2 truncate flex items-center gap-1"><UserRound className="w-3 h-3" /> {seller.name} • sem selo</p>}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Lojas próximas */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg lg:text-xl font-extrabold">Lojas oficiais</h2>
          <Link to="/cliente/lojas" className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">
            Ver todas <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {nearbyStores.map((store) => (
            <Link
              key={store.id}
              to={`/cliente/loja/${store.id}`}
              className="bg-card rounded-2xl shadow-card flex gap-3 items-center p-3 hover:shadow-elevated transition-all"
            >
              <img
                src={store.image}
                alt={store.name}
                loading="lazy"
                className="size-20 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-sm font-bold truncate">{store.name}</h3>
                  {store.verificationStatus === "verificado" && <VerifiedBadge compact className="shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{store.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <Star className="w-3 h-3 fill-warning text-warning" /> {store.rating}
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
    </div>
  );
};

export default ClientHome;
