import { Link } from "react-router-dom";
import { Star, Clock, MapPin } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { stores } from "@/data/mockData";
import { ClientTabBar } from "@/components/ClientTabBar";

const StoreList = () => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar title="Lojas próximas" />
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-hide">
        {stores.map((s) => (
          <Link
            key={s.id}
            to={`/cliente/loja/${s.id}`}
            className="block bg-card rounded-2xl overflow-hidden shadow-card active:scale-[0.99] transition-transform"
          >
            <img src={s.image} alt={s.name} loading="lazy" className="w-full h-32 object-cover" />
            <div className="p-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold">{s.name}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{s.description}</p>
                </div>
                <span className="bg-accent text-accent-foreground px-2 py-0.5 rounded-md font-bold text-xs flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-current" /> {s.rating}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.distance}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.deliveryTime}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <ClientTabBar />
    </div>
  );
};

export default StoreList;
