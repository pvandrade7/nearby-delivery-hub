import { Link, useNavigate } from "react-router-dom";
import {
  Star, ChevronRight, Tag, UserRound, MapPin, Heart,
  TrendingUp, Sparkles, BadgeCheck, Store as StoreIcon,
} from "lucide-react";
import { categories, stores, products, getProductSeller } from "@/data/mockData";
import { VerifiedCheckIcon } from "@/components/VerifiedBadge";
import { StoreLogo } from "@/components/StoreLogo";
import { useFavorite } from "@/hooks/useFavorite";
import { useUserCity, normalizeCity } from "@/hooks/useUserCity";

/* ── Card de loja local — destaque maior ────────────── */
const LocalStoreCard = ({ store }: { store: typeof stores[0] }) => {
  const { favorited, toggle, loading: favLoading } = useFavorite({
    id: store.id, name: store.name, image: store.image, category: store.category,
  });
  const cat = categories.find((c) => c.id === store.category);

  return (
    <div className="relative bg-card rounded-2xl shadow-card overflow-hidden hover:shadow-elevated hover:-translate-y-0.5 transition-all group">
      <Link to={`/cliente/loja/${store.id}`} className="block">
        {/* Logo sobre fundo da cor da marca */}
        <div
          className="aspect-[4/3] flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundColor: store.brandColor ? `${store.brandColor}18` : undefined }}
        >
          <StoreLogo store={store} size="xl" whiteBg className="shadow-card" />
        </div>

        {/* Badge "Local" fixo na imagem */}
        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-full bg-green-500 text-white shadow">
          🏪 Local
        </span>

        <div className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight truncate">{store.name}</p>
              {cat && (
                <p className="text-[11px] text-primary font-bold mt-0.5">{cat.emoji} {cat.name}</p>
              )}
            </div>
            <span className="bg-accent text-accent-foreground px-2 py-0.5 rounded-md font-bold text-xs flex items-center gap-1 shrink-0">
              <Star className="w-2.5 h-2.5 fill-current" /> {store.rating}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{store.description}</p>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-2">
            <span>{store.distance}</span>
            <span>·</span>
            <span>{store.deliveryTime}</span>
          </div>
        </div>
      </Link>

      {/* Botão favoritar */}
      <button
        onClick={toggle} disabled={favLoading}
        aria-label={favorited ? "Remover dos favoritos" : "Favoritar"}
        className={`absolute top-2 right-2 size-8 rounded-full flex items-center justify-center shadow-card transition-all active:scale-90 ${
          favorited ? "bg-red-500 text-white" : "bg-white/80 backdrop-blur text-muted-foreground hover:text-red-400"
        }`}
      >
        <Heart className={`w-4 h-4 ${favorited ? "fill-white" : ""}`} />
      </button>
    </div>
  );
};

/* ── Card de loja secundária (grandes redes) ─────── */
const ChainStoreCard = ({ store }: { store: typeof stores[0] }) => (
  <Link
    to={`/cliente/loja/${store.id}`}
    className="bg-card rounded-xl shadow-card flex items-center gap-3 p-3 hover:shadow-elevated transition-all"
  >
    <StoreLogo store={store} size="sm" whiteBg />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold truncate">{store.name}</p>
      <p className="text-xs text-muted-foreground truncate">{store.deliveryTime}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
  </Link>
);

/* ════════════════════════════════════════════════════ */
const ClientHome = () => {
  const navigate = useNavigate();
  const { city } = useUserCity();

  /* Separa lojas por tipo */
  const filterByCity = (arr: typeof stores) =>
    city
      ? arr.filter((s) =>
          normalizeCity(s.city).includes(normalizeCity(city)) ||
          normalizeCity(city).includes(normalizeCity(s.city))
        )
      : arr;

  const cityStores  = filterByCity(stores);
  const localStores = cityStores.filter((s) => s.isLocal);
  const chainStores = cityStores.filter((s) => !s.isLocal);

  /* Produtos de lojas locais (para seções de destaque) */
  const localStoreIds = new Set(localStores.map((s) => s.id));
  const localProducts = products.filter(
    (p) => p.storeId && localStoreIds.has(p.storeId)
  );
  const localOnSale  = localProducts.filter((p) => p.onSale);
  const localPopular = localProducts.filter((p) => p.popular);

  /* Produtos de pessoas físicas */
  const usedItems = products.filter((p) => p.sellerId);

  /* Contagem de negócios locais para o hero */
  const localCount = localStores.length;

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1400px] mx-auto space-y-8 sm:space-y-10">

      {/* ══ HERO ═══════════════════════════════════════ */}
      <section className="rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-glow text-primary-foreground p-5 sm:p-8 lg:p-10 shadow-elevated overflow-hidden relative">
        {/* Decoração de fundo */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }} />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-3 py-1.5 text-xs font-bold mb-4">
              <Heart className="w-3.5 h-3.5 fill-white" />
              Marketplace do comércio local
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight">
              Fortaleça quem faz<br />
              <span className="text-white/90">a sua cidade viver.</span>
            </h1>
            <p className="text-sm sm:text-base text-white/80 mt-3 max-w-md">
              Compre de microempreendedores, pequenas lojas e negócios de bairro.
              Cada compra fortalece o comércio local.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <button
                onClick={() => navigate("/cliente/lojas")}
                className="inline-flex items-center gap-2 bg-white text-primary font-bold rounded-xl px-5 py-2.5 text-sm shadow-elevated hover:bg-white/90 transition-colors"
              >
                <StoreIcon className="w-4 h-4" />
                Ver lojas locais
              </button>
              <button
                onClick={() => navigate("/cliente/busca")}
                className="inline-flex items-center gap-2 bg-white/15 backdrop-blur font-bold rounded-xl px-5 py-2.5 text-sm hover:bg-white/25 transition-colors"
              >
                Explorar produtos
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 lg:min-w-[160px]">
            {[
              { value: `${localCount}`, label: "negócios locais" },
              { value: city ?? "FOR", label: "sua cidade" },
              { value: "100%", label: "empreendedores" },
            ].map((s) => (
              <div key={s.label} className="bg-white/15 backdrop-blur rounded-xl px-3 py-3 text-center">
                <p className="text-xl sm:text-2xl font-extrabold">{s.value}</p>
                <p className="text-[11px] text-white/75 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ LOCALIZAÇÃO ═══════════════════════════════ */}
      {city && (
        <div className="flex items-center gap-2.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl px-4 py-3 text-sm">
          <MapPin className="w-4 h-4 text-green-600 shrink-0" />
          <span className="text-muted-foreground">
            Mostrando negócios locais em{" "}
            <span className="font-bold text-foreground">{city}</span>
          </span>
          <Link to="/cliente/lojas" className="ml-auto text-primary font-semibold hover:underline shrink-0 text-xs">
            Ver todos →
          </Link>
        </div>
      )}

      {/* ══ CATEGORIAS ════════════════════════════════ */}
      <section>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Navegue por segmento</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/cliente/busca?cat=${cat.id}`)}
              className="bg-card hover:shadow-elevated transition-all rounded-xl p-2.5 flex flex-col items-center gap-1.5 shadow-card group"
            >
              <div className="size-9 lg:size-10 rounded-lg bg-accent flex items-center justify-center text-lg lg:text-xl group-hover:scale-110 transition-transform">
                {cat.emoji}
              </div>
              <span className="text-[10px] font-semibold text-center leading-tight">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ══ EMPREENDEDORES EM DESTAQUE ════════════════ */}
      {localStores.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-lg lg:text-xl font-extrabold">Empreendedores locais em destaque</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pequenos negócios próximos de você
              </p>
            </div>
            <Link to="/cliente/lojas" className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline shrink-0">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {localStores.slice(0, 10).map((store) => (
              <LocalStoreCard key={store.id} store={store} />
            ))}
          </div>
        </section>
      )}

      {/* ══ OFERTAS DO COMÉRCIO LOCAL ══════════════════ */}
      {localOnSale.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-secondary" />
              <h2 className="text-lg lg:text-xl font-extrabold">Ofertas de pequenos negócios</h2>
            </div>
            <Link to="/cliente/busca" className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">
              Ver mais <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {localOnSale.slice(0, 10).map((p) => {
              const seller = getProductSeller(p);
              const off = p.originalPrice
                ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
              return (
                <Link key={p.id} to={`/cliente/produto/${p.id}`}
                  className="bg-card rounded-2xl shadow-card overflow-hidden hover:shadow-elevated hover:-translate-y-0.5 transition-all">
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
                      <p className="text-xs text-muted-foreground line-through">R$ {p.originalPrice.toFixed(2)}</p>
                    )}
                    <p className="text-base font-extrabold text-primary leading-none">R$ {p.price.toFixed(2)}</p>
                    {seller && (
                      <p className="text-[11px] text-green-600 dark:text-green-400 mt-1.5 truncate flex items-center gap-1 font-semibold">
                        🏪 {seller.name}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ══ MAIS VENDIDOS DOS PEQUENOS NEGÓCIOS ════════ */}
      {localPopular.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg lg:text-xl font-extrabold">Mais pedidos no comércio local</h2>
            </div>
            <Link to="/cliente/busca" className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">
              Ver mais <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {localPopular.slice(0, 10).map((p) => {
              const seller = getProductSeller(p);
              return (
                <Link key={p.id} to={`/cliente/produto/${p.id}`}
                  className="bg-card rounded-2xl shadow-card overflow-hidden hover:shadow-elevated hover:-translate-y-0.5 transition-all">
                  <div className="aspect-square bg-muted">
                    <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold leading-tight line-clamp-2 min-h-[40px]">{p.name}</p>
                    <p className="text-base font-extrabold text-primary mt-1">R$ {p.price.toFixed(2)}</p>
                    {seller && (
                      <p className="text-[11px] text-green-600 dark:text-green-400 mt-1.5 truncate flex items-center gap-1 font-semibold">
                        🏪 {seller.name}
                        {seller.verified && <VerifiedCheckIcon />}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ══ USADOS / PESSOAS FÍSICAS ═══════════════════ */}
      {usedItems.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg lg:text-xl font-extrabold">Usados e seminovos</h2>
            <Link to="/cliente/busca?tipo=pessoa" className="text-sm text-primary font-semibold flex items-center gap-1 hover:underline">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {usedItems.map((p) => {
              const seller = getProductSeller(p);
              return (
                <Link key={p.id} to={`/cliente/produto/${p.id}`}
                  className="bg-card rounded-2xl shadow-card overflow-hidden hover:shadow-elevated hover:-translate-y-0.5 transition-all">
                  <div className="aspect-square bg-muted">
                    <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold leading-tight line-clamp-2 min-h-[40px]">{p.name}</p>
                    {p.originalPrice && (
                      <p className="text-xs text-muted-foreground line-through">R$ {p.originalPrice.toFixed(2)}</p>
                    )}
                    <p className="text-base font-extrabold text-primary mt-0.5">R$ {p.price.toFixed(2)}</p>
                    {seller && (
                      <p className="text-[11px] text-muted-foreground mt-1.5 truncate flex items-center gap-1">
                        <UserRound className="w-3 h-3" /> {seller.name}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ══ GRANDES REDES (SECUNDÁRIO) ═════════════════ */}
      {chainStores.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BadgeCheck className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Grandes redes também disponíveis
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Além dos pequenos negócios, você também pode comprar em redes nacionais parceiras.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {chainStores.map((store) => (
              <ChainStoreCard key={store.id} store={store} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ClientHome;
