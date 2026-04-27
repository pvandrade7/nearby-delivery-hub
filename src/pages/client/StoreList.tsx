import { Link } from "react-router-dom";
import { Star, MapPin, Clock, ChevronRight } from "lucide-react";
import { stores, products, categories } from "@/data/mockData";
import { VerifiedBadge } from "@/components/VerifiedBadge";

const StoreList = () => {
  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-extrabold">Lojas oficiais</h1>
        <p className="text-sm text-muted-foreground mt-1">{stores.length} lojas comerciais verificadas atendendo na sua região</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {stores.map((s) => {
          const cat = categories.find((c) => c.id === s.category);
          const sample = products.filter((p) => p.storeId === s.id).slice(0, 3);
          return (
            <Link
              key={s.id}
              to={`/cliente/loja/${s.id}`}
              className="block bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all"
            >
              <div className="flex gap-4 p-4">
                <img src={s.image} alt={s.name} loading="lazy" className="size-24 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold leading-tight">{s.name}</h3>
                      <VerifiedBadge compact className="mt-1" />
                    </div>
                    <span className="bg-accent text-accent-foreground px-2 py-0.5 rounded-md font-bold text-xs flex items-center gap-1 shrink-0">
                      <Star className="w-3 h-3 fill-current" /> {s.rating}
                    </span>
                  </div>
                  {cat && (
                    <p className="text-[11px] text-primary font-bold uppercase tracking-wider mt-1">
                      {cat.emoji} {cat.name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.distance}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.deliveryTime}</span>
                  </div>
                </div>
              </div>
              {sample.length > 0 && (
                <div className="border-t border-border px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-hide bg-muted/20">
                  {sample.map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5 bg-background rounded-full pl-1 pr-2.5 py-1 shrink-0">
                      <img src={p.image} alt="" loading="lazy" className="size-5 rounded-full object-cover bg-muted" />
                      <span className="text-[10px] font-semibold whitespace-nowrap">{p.name.split(" ").slice(0, 2).join(" ")}</span>
                    </div>
                  ))}
                  <ChevronRight className="w-4 h-4 text-muted-foreground self-center ml-auto shrink-0" />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default StoreList;
