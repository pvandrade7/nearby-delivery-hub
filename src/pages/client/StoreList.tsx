import { Link } from "react-router-dom";
import { Star, MapPin, Clock } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { stores, products, categories } from "@/data/mockData";
import { ClientTabBar } from "@/components/ClientTabBar";

const StoreList = () => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      <TopBar title="Lojas próximas" />
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-hide">
        {stores.map((s) => {
          const cat = categories.find((c) => c.id === s.category);
          const sample = products.filter((p) => p.storeId === s.id).slice(0, 3);
          return (
            <Link
              key={s.id}
              to={`/cliente/loja/${s.id}`}
              className="block bg-card rounded-2xl overflow-hidden shadow-card active:scale-[0.99] transition-transform"
            >
              <div className="flex gap-3 p-3">
                <img src={s.image} alt={s.name} loading="lazy" width={88} height={88} className="size-[88px] rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold leading-tight">{s.name}</h3>
                    <span className="bg-accent text-accent-foreground px-1.5 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-0.5 shrink-0">
                      <Star className="w-2.5 h-2.5 fill-current" /> {s.rating}
                    </span>
                  </div>
                  {cat && (
                    <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mt-0.5">
                      {cat.emoji} {cat.name}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.distance}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.deliveryTime}</span>
                  </div>
                </div>
              </div>
              {sample.length > 0 && (
                <div className="border-t border-border px-3 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
                  {sample.map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5 bg-muted rounded-full pl-1 pr-2.5 py-1 shrink-0">
                      <img src={p.image} alt="" loading="lazy" width={20} height={20} className="size-5 rounded-full object-cover bg-background" />
                      <span className="text-[10px] font-semibold whitespace-nowrap">{p.name.split(" ").slice(0, 2).join(" ")}</span>
                    </div>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
      <ClientTabBar />
    </div>
  );
};

export default StoreList;
