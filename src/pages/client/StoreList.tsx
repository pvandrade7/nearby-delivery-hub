import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, Clock, ChevronRight, Heart, Search, X, Sparkles } from "lucide-react";
import { stores as MOCK_STORES, categories } from "@/data/mockData";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useStores } from "@/hooks/useStores";
import { StoreLogo } from "@/components/StoreLogo";
import { useFavorite } from "@/hooks/useFavorite";
import { useUserCity, normalizeCity } from "@/hooks/useUserCity";

/* ── Card individual com botão de favoritar ─────── */
const StoreCard = ({ s }: { s: typeof MOCK_STORES[0] }) => {
  const cat = categories.find((c) => c.id === s.category);
  const { favorited, toggle, loading: favLoading } = useFavorite({
    id: s.id, name: s.name, image: s.image, category: cat?.name ?? s.category,
  });

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all relative">
      <Link to={`/cliente/loja/${s.id}`} className="block">
        <div className="flex gap-4 p-4">
          <StoreLogo store={s} size="lg" whiteBg />
          <div className="flex-1 min-w-0 pr-8">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-bold leading-tight truncate">{s.name}</h3>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <VerifiedBadge compact />
                  {s.isLocal && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      🏪 Local
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span className="bg-accent text-accent-foreground px-2 py-0.5 rounded-md font-bold text-xs flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> {s.rating}
                </span>
                {s.reviews > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    ({s.reviews.toLocaleString("pt-BR")})
                  </span>
                )}
              </div>
            </div>
            {(cat || s.category) && (
              <p className="text-[11px] text-primary font-bold uppercase tracking-wider mt-1">
                {cat ? `${cat.emoji} ${cat.name}` : s.category}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.distance}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.deliveryTime}</span>
            </div>
            {s.address && (
              <p className="text-[10px] text-muted-foreground/70 mt-1 truncate">{s.address}</p>
            )}
          </div>
        </div>
      </Link>

      {/* Botão favoritar */}
      <button
        onClick={(e) => { e.stopPropagation(); toggle(); }}
        disabled={favLoading}
        aria-label={favorited ? "Remover dos favoritos" : "Favoritar"}
        className={`absolute top-3 right-3 size-8 rounded-full flex items-center justify-center shadow-card transition-all active:scale-90 ${
          favorited ? "bg-red-500 text-white" : "bg-card border border-border text-muted-foreground hover:text-red-400 hover:border-red-300"
        }`}
      >
        <Heart className={`w-4 h-4 ${favorited ? "fill-white" : ""} ${favLoading ? "opacity-40" : ""}`} />
      </button>

      {/* Seta de navegação */}
      <Link to={`/cliente/loja/${s.id}`} className="border-t border-border px-4 py-2.5 flex items-center justify-between bg-muted/20 hover:bg-muted/40 transition-colors">
        <span className="text-xs font-semibold text-muted-foreground">Ver produtos</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </Link>
    </div>
  );
};

/* ════════════════════════════════════════════════════ */
const StoreList = () => {
  const { city } = useUserCity();
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [showAllCities, setShowAllCities] = useState(false);
  const [tab, setTab] = useState<"local" | "all">("local");

  const { data: allStores = MOCK_STORES } = useStores();

  /* Filtra por cidade */
  const cityStores = (!showAllCities && city)
    ? allStores.filter((s) =>
        normalizeCity(s.city).includes(normalizeCity(city)) ||
        normalizeCity(city).includes(normalizeCity(s.city))
      )
    : allStores;

  /* Locais/urbanas primeiro, depois grandes redes */
  const sortedCityStores = [
    ...cityStores.filter((s) => s.isLocal),
    ...cityStores.filter((s) => !s.isLocal),
  ];

  /* Aplica filtro de tab (local / todas) + busca + categoria */
  const tabFiltered = tab === "local"
    ? sortedCityStores.filter((s) => s.isLocal)
    : sortedCityStores;

  const visible = tabFiltered.filter((s) => {
    const matchSearch = search
      ? s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchCat = selectedCat ? s.category === selectedCat : true;
    return matchSearch && matchCat;
  });

  const storeCategories = categories.filter((c) =>
    tabFiltered.some((s) => s.category === c.id)
  );

  const localCount = sortedCityStores.filter((s) => s.isLocal).length;
  const allCount   = sortedCityStores.length;

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl lg:text-3xl font-extrabold">Lojas parceiras</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {visible.length} loja{visible.length !== 1 ? "s" : ""} disponíve{visible.length !== 1 ? "is" : "l"}
          {city && !showAllCities && ` em ${city}`}
        </p>
      </div>

      {/* Tabs: Comércio Local / Todas */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => { setTab("local"); setSelectedCat(""); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === "local"
              ? "gradient-brand text-primary-foreground shadow-card"
              : "bg-card border border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Comércio local
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
            tab === "local" ? "bg-white/20" : "bg-muted"
          }`}>{localCount}</span>
        </button>
        <button
          onClick={() => { setTab("all"); setSelectedCat(""); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === "all"
              ? "gradient-brand text-primary-foreground shadow-card"
              : "bg-card border border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          Todas as lojas
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
            tab === "all" ? "bg-white/20" : "bg-muted"
          }`}>{allCount}</span>
        </button>
      </div>

      {/* Banner de cidade */}
      {city && (
        <div className="flex items-center justify-between bg-primary/8 border border-primary/20 rounded-2xl px-4 py-3 text-sm mb-5">
          <span className="text-muted-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            {showAllCities ? "Exibindo lojas de todas as cidades" : `Exibindo lojas em `}
            {!showAllCities && <span className="font-bold text-foreground">{city}</span>}
          </span>
          <button
            onClick={() => setShowAllCities((v) => !v)}
            className="text-primary font-semibold text-xs hover:underline shrink-0"
          >
            {showAllCities ? `Mostrar apenas ${city}` : "Ver todas as cidades"}
          </button>
        </div>
      )}

      {/* Busca */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar loja ou segmento..."
          className="w-full bg-card border border-border rounded-xl pl-11 pr-10 py-3 text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-muted flex items-center justify-center">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filtro de categorias */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
        <button
          onClick={() => setSelectedCat("")}
          className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors shrink-0 ${
            !selectedCat ? "gradient-brand text-primary-foreground shadow-card" : "bg-card border border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          Todas
        </button>
        {storeCategories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCat(selectedCat === c.id ? "" : c.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors shrink-0 ${
              selectedCat === c.id ? "gradient-brand text-primary-foreground shadow-card" : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            <span>{c.emoji}</span> {c.name}
          </button>
        ))}
      </div>

      {/* Grid de lojas */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold">Nenhuma loja encontrada</p>
          <p className="text-sm mt-1">Tente outro termo ou categoria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((s) => <StoreCard key={s.id} s={s} />)}
        </div>
      )}
    </div>
  );
};

export default StoreList;
