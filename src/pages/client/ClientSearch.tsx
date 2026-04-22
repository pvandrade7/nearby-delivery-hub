import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, X, Star } from "lucide-react";
import { categories, products, stores } from "@/data/mockData";

const ClientSearch = () => {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const cat = params.get("cat") ?? "";

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchQ = query ? p.name.toLowerCase().includes(query.toLowerCase()) : true;
      const matchC = cat ? p.category === cat : true;
      return matchQ && matchC;
    });
  }, [query, cat]);

  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const matchQ = query ? s.name.toLowerCase().includes(query.toLowerCase()) : true;
      const matchC = cat ? s.category === cat : true;
      return matchQ && matchC;
    });
  }, [query, cat]);

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-4">Buscar</h1>

      <div className="relative max-w-2xl">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="O que você procura?"
          className="w-full bg-card border border-border rounded-xl pl-12 pr-12 py-3 text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 size-7 rounded-full bg-muted flex items-center justify-center">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pt-4 scrollbar-hide">
        <button
          onClick={() => setParams({})}
          className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
            !cat ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground hover:bg-muted"
          }`}
        >
          Todos
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setParams({ cat: c.id })}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 ${
              cat === c.id ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground hover:bg-muted"
            }`}
          >
            <span>{c.emoji}</span>
            {c.name}
          </button>
        ))}
      </div>

      <div className="space-y-8 mt-8">
        {filteredStores.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Lojas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStores.map((s) => (
                <Link key={s.id} to={`/cliente/loja/${s.id}`} className="bg-card rounded-2xl p-3 shadow-card flex gap-3 items-center hover:shadow-elevated transition-all">
                  <img src={s.image} alt={s.name} loading="lazy" className="size-14 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-warning text-warning" /> {s.rating} • {s.distance}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {filteredProducts.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Produtos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {filteredProducts.map((p) => {
                const store = stores.find((s) => s.id === p.storeId);
                return (
                  <Link key={p.id} to={`/cliente/produto/${p.id}`} className="bg-card rounded-2xl shadow-card overflow-hidden flex flex-col hover:shadow-elevated hover:-translate-y-0.5 transition-all">
                    <div className="aspect-square bg-muted">
                      <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <p className="text-sm font-semibold leading-tight line-clamp-2 flex-1">{p.name}</p>
                      {p.originalPrice && (
                        <p className="text-xs text-muted-foreground line-through mt-1">R$ {p.originalPrice.toFixed(2)}</p>
                      )}
                      <p className="text-base font-extrabold text-primary leading-none mt-0.5">R$ {p.price.toFixed(2)}</p>
                      {store && (
                        <p className="text-[11px] text-muted-foreground mt-2 truncate">⭐ {store.rating} • {store.name}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {filteredStores.length === 0 && filteredProducts.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-5xl mb-3">🔍</p>
            <p className="text-sm">Nada encontrado para "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientSearch;
