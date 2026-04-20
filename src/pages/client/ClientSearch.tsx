import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { categories, products, stores } from "@/data/mockData";
import { ClientTabBar } from "@/components/ClientTabBar";

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
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Buscar" />

      <div className="px-5 py-4 border-b border-border">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="O que você procura?"
            className="w-full bg-muted rounded-2xl pl-11 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-foreground/10 flex items-center justify-center">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pt-3 -mx-5 px-5 scrollbar-hide">
          <button
            onClick={() => setParams({})}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
              !cat ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setParams({ cat: c.id })}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1 ${
                cat === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}
            >
              <span>{c.emoji}</span>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 scrollbar-hide">
        {filteredStores.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Lojas</h2>
            <div className="space-y-2">
              {filteredStores.map((s) => (
                <Link key={s.id} to={`/cliente/loja/${s.id}`} className="bg-card rounded-2xl p-3 shadow-card flex gap-3 items-center">
                  <img src={s.image} alt={s.name} loading="lazy" width={48} height={48} className="size-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{s.description}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">⭐ {s.rating} • {s.distance}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {filteredProducts.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">Produtos</h2>
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((p) => {
                const store = stores.find((s) => s.id === p.storeId);
                return (
                  <Link key={p.id} to={`/cliente/produto/${p.id}`} className="bg-card rounded-2xl shadow-card overflow-hidden flex flex-col">
                    <div className="aspect-square bg-muted">
                      <img src={p.image} alt={p.name} loading="lazy" width={300} height={300} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2.5 flex flex-col flex-1">
                      <p className="text-xs font-semibold leading-tight line-clamp-2 flex-1">{p.name}</p>
                      {p.originalPrice && (
                        <p className="text-[10px] text-muted-foreground line-through mt-1">R$ {p.originalPrice.toFixed(2)}</p>
                      )}
                      <p className="text-sm font-extrabold text-primary leading-none mt-0.5">R$ {p.price.toFixed(2)}</p>
                      {store && (
                        <p className="text-[10px] text-muted-foreground mt-1 truncate">⭐ {store.rating} • {store.name}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {filteredStores.length === 0 && filteredProducts.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm">Nada encontrado para "{query}"</p>
          </div>
        )}
      </div>

      <ClientTabBar />
    </div>
  );
};

export default ClientSearch;
