import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, Star, Clock, ChevronRight } from "lucide-react";
import { categories, stores } from "@/data/mockData";
import { ClientTabBar } from "@/components/ClientTabBar";

const ClientHome = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide pb-2">
      {/* Hero header */}
      <header className="gradient-sunset text-primary-foreground px-5 pt-6 pb-8 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <div>
              <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Entregar em</p>
              <p className="text-sm font-bold">Rua das Flores, 200</p>
            </div>
          </div>
          <Link
            to="/"
            className="size-10 rounded-full bg-white/25 backdrop-blur flex items-center justify-center font-bold"
          >
            J
          </Link>
        </div>

        <h1 className="text-2xl font-extrabold leading-tight mb-1">
          Olá, João! 👋
        </h1>
        <p className="text-sm text-white/85 mb-4">O que você quer hoje?</p>

        <button
          onClick={() => navigate("/cliente/busca")}
          className="w-full bg-background text-muted-foreground rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-card text-left"
        >
          <Search className="w-5 h-5 text-primary" />
          <span className="text-sm">Buscar produtos ou lojas...</span>
        </button>
      </header>

      <div className="px-5 pt-6 space-y-7">
        {/* Categories */}
        <section>
          <h2 className="text-base font-bold mb-3">Categorias</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/cliente/busca?cat=${cat.id}`)}
                className="flex flex-col items-center gap-1.5 min-w-[68px] active:scale-95 transition-transform"
              >
                <div className="size-16 rounded-2xl bg-accent flex items-center justify-center text-3xl shadow-card">
                  {cat.emoji}
                </div>
                <span className="text-[11px] font-semibold">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Promo banner */}
        <div className="gradient-brand rounded-2xl p-4 text-primary-foreground flex justify-between items-center shadow-card">
          <div>
            <p className="text-xs opacity-90 font-semibold">FRETE GRÁTIS 🚚</p>
            <p className="font-bold text-base leading-tight">Em compras acima de R$ 50</p>
          </div>
          <span className="text-4xl">🎉</span>
        </div>

        {/* Nearby stores */}
        <section>
          <div className="flex justify-between items-baseline mb-3">
            <h2 className="text-base font-bold">Lojas pertinho</h2>
            <Link to="/cliente/lojas" className="text-xs text-primary font-semibold flex items-center gap-0.5">
              Ver todas <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {stores.map((store) => (
              <Link
                key={store.id}
                to={`/cliente/loja/${store.id}`}
                className="block bg-card rounded-2xl p-3 shadow-card flex gap-3 items-center active:scale-[0.99] transition-transform"
              >
                <img
                  src={store.image}
                  alt={store.name}
                  loading="lazy"
                  width={64}
                  height={64}
                  className="size-16 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate">{store.name}</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                    <span className="bg-accent text-accent-foreground px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-current" /> {store.rating}
                    </span>
                    <span>{store.distance}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{store.deliveryTime}</span>
                  </div>
                  {store.freeShippingFrom && (
                    <p className="text-[10px] text-success font-semibold mt-1">
                      Frete grátis acima de R$ {store.freeShippingFrom}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <ClientTabBar />
    </div>
  );
};

export default ClientHome;
