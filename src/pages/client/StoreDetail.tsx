import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Star, Clock, MapPin, Plus, ArrowLeft, Heart, MessageSquare, Send, Pencil, ChevronRight } from "lucide-react";
import { products, categories } from "@/data/mockData";
import type { Logistica, Product } from "@/data/mockData";
import { useCart } from "@/context/CartContext";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { StoreLogo } from "@/components/StoreLogo";
import { useFavorite } from "@/hooks/useFavorite";
import { ENTREGA_ICON, ENTREGA_LABEL, ENTREGA_COLOR } from "@/lib/logistica";
import { useStores, isSupabaseId } from "@/hooks/useStores";
import { useReviews, useUserReview, useSubmitReview, aggregateReviews } from "@/hooks/useReviews";
import type { ReviewItem } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// ── Entrega badge ─────────────────────────────────────────────────────────────

const EntregaBadge = ({ log }: { log: Logistica | undefined }) => {
  if (!log) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1.5 ${ENTREGA_COLOR[log.entrega]}`}>
      {ENTREGA_ICON[log.entrega]} {ENTREGA_LABEL[log.entrega]}
    </span>
  );
};

// ── Estrelas (somente leitura) ────────────────────────────────────────────────

const Stars = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) => {
  const cls = size === "lg" ? "w-5 h-5" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${cls} ${n <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </span>
  );
};

// ── Distribuição esperada para lojas mock ────────────────────────────────────
// Gera proporções plausíveis a partir da média informada no mockData.

const mockDistribution = (avg: number, total: number): Record<number, number> => {
  const r = Math.min(5, Math.max(1, avg));
  let props: number[];
  if      (r >= 4.8) props = [0.75, 0.15, 0.05, 0.03, 0.02];
  else if (r >= 4.5) props = [0.65, 0.20, 0.08, 0.04, 0.03];
  else if (r >= 4.0) props = [0.50, 0.30, 0.12, 0.05, 0.03];
  else if (r >= 3.5) props = [0.35, 0.30, 0.20, 0.10, 0.05];
  else               props = [0.25, 0.25, 0.25, 0.15, 0.10];

  const counts = props.map((p) => Math.round(p * total));
  // Ajusta o 1★ para que a soma seja exatamente `total`
  const rest = total - counts[0] - counts[1] - counts[2] - counts[3];
  return { 5: counts[0], 4: counts[1], 3: counts[2], 2: counts[3], 1: Math.max(0, rest) };
};

// ── Card de review ────────────────────────────────────────────────────────────

const ReviewCard = ({ review }: { review: ReviewItem }) => (
  <div className="bg-card rounded-2xl p-4 shadow-card">
    <div className="flex items-start gap-3">
      <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-extrabold text-primary shrink-0">
        {review.buyerInitial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold truncate">{review.buyerName}</p>
          <p className="text-[11px] text-muted-foreground shrink-0">{review.createdAt}</p>
        </div>
        <Stars rating={review.rating} size="sm" />
        {review.comment && (
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{review.comment}</p>
        )}
      </div>
    </div>
  </div>
);

// ── Barra de distribuição ─────────────────────────────────────────────────────

const DistBar = ({ n, count, max }: { n: number; count: number; max: number }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs font-bold text-muted-foreground w-3 shrink-0 text-right">{n}</span>
    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" />
    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
      <div
        className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
        style={{ width: max > 0 ? `${Math.round((count / max) * 100)}%` : "0%" }}
      />
    </div>
    <span className="text-xs text-muted-foreground w-6 text-right shrink-0">{count}</span>
  </div>
);

// ── Seção de avaliações ───────────────────────────────────────────────────────

interface ReviewsSectionProps {
  storeId:          string;
  category:         string;
  /** Nota pré-calculada do mockData (usada como "verdade" para lojas mock). */
  storeRating:      number;
  /** Total de avaliações declarado no mockData. */
  storeReviewCount: number;
  highlighted:      boolean;
}

const ReviewsSection = ({
  storeId, category, storeRating, storeReviewCount, highlighted,
}: ReviewsSectionProps) => {
  const { user } = useAuth();
  const isMock = !isSupabaseId(storeId);

  const { data: reviews = [], isLoading } = useReviews(storeId, category);
  const { data: userReview }              = useUserReview(storeId);
  const { mutate, isPending }             = useSubmitReview(storeId);

  const [rating,      setRating]      = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment,     setComment]     = useState("");
  const [showForm,    setShowForm]    = useState(false);

  useEffect(() => {
    if (userReview) { setRating(userReview.rating); setComment(userReview.comment); }
  }, [userReview?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fonte única de dados de estatísticas ──────────────────────────────────
  // Para lojas mock: usa os valores pré-declarados no mockData (coerentes com
  // o cabeçalho da loja) + distribuição sintética proporcional.
  // Para lojas reais: calcula tudo a partir das avaliações reais do banco.
  const realStats  = aggregateReviews(reviews);
  const displayAvg = isMock ? storeRating      : realStats.avg;
  const displayCnt = isMock ? storeReviewCount : realStats.count;
  const displayDist: Record<number, number> = isMock
    ? mockDistribution(storeRating, storeReviewCount)
    : realStats.dist;
  const maxDist = Math.max(...Object.values(displayDist), 1);

  const handleSubmit = () => {
    if (rating === 0) return;
    mutate({ rating, comment }, { onSuccess: () => setShowForm(false) });
  };

  if (isLoading) {
    return (
      <div className="mt-8 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const sectionTitle = isMock
    ? `Avaliações dos clientes (${displayCnt.toLocaleString("pt-BR")})`
    : `Avaliações dos clientes${displayCnt > 0 ? ` (${displayCnt})` : ""}`;

  return (
    <section
      className={`mt-8 transition-all duration-300 rounded-2xl ${
        highlighted ? "ring-2 ring-primary/40 bg-primary/3 p-4 -mx-4" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-extrabold">{sectionTitle}</h2>
        </div>
        {!isMock && user && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            {userReview ? "Editar avaliação" : "Avaliar loja"}
          </button>
        )}
      </div>

      {/* Estatísticas — sempre exibidas quando há avaliações */}
      {displayCnt > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-card rounded-2xl p-5 shadow-card flex flex-col items-center justify-center gap-2 text-center">
            <p className="text-5xl font-extrabold text-foreground">{displayAvg}</p>
            <Stars rating={displayAvg} size="lg" />
            <p className="text-sm text-muted-foreground font-semibold">
              {displayCnt.toLocaleString("pt-BR")} avaliação{displayCnt !== 1 ? "ões" : ""}
            </p>
          </div>
          <div className="bg-card rounded-2xl p-5 shadow-card space-y-2 justify-center flex flex-col">
            {([5, 4, 3, 2, 1] as const).map((n) => (
              <DistBar key={n} n={n} count={displayDist[n] ?? 0} max={maxDist} />
            ))}
          </div>
        </div>
      )}

      {/* Formulário (apenas lojas reais + usuário logado) */}
      {!isMock && user && showForm && (
        <div className="bg-card rounded-2xl p-5 shadow-card mb-6 space-y-4">
          <h3 className="font-bold text-base">
            {userReview ? "Editar sua avaliação" : "Deixar uma avaliação"}
          </h3>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Nota</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(n)}
                  className="p-0.5 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      n <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            {(hoverRating || rating) > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {["", "Muito ruim", "Ruim", "Regular", "Bom", "Excelente"][hoverRating || rating]}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              Comentário (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={400}
              placeholder="Conte como foi sua experiência com esta loja..."
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <p className="text-[11px] text-muted-foreground text-right mt-1">{comment.length}/400</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={isPending || rating === 0}
              className="inline-flex items-center gap-2 gradient-brand text-primary-foreground rounded-xl px-5 py-2.5 font-bold shadow-card hover:shadow-elevated transition-shadow disabled:opacity-60 text-sm"
            >
              <Send className="w-3.5 h-3.5" />
              {isPending ? "Enviando..." : userReview ? "Atualizar" : "Enviar avaliação"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Avaliação existente do usuário */}
      {!isMock && user && userReview && !showForm && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">Sua avaliação</p>
            <button onClick={() => setShowForm(true)} className="text-xs text-primary font-semibold hover:underline">
              Editar
            </button>
          </div>
          <Stars rating={userReview.rating} size="sm" />
          {userReview.comment && (
            <p className="text-sm text-muted-foreground mt-1">{userReview.comment}</p>
          )}
        </div>
      )}

      {/* Lista de reviews */}
      {reviews.length === 0 && displayCnt === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p className="text-3xl mb-2">💬</p>
          <p className="font-semibold">Nenhuma avaliação ainda</p>
          {user && !isMock && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-2 gradient-brand text-primary-foreground rounded-xl px-5 py-2 font-bold shadow-card text-sm"
            >
              <Star className="w-4 h-4" /> Avaliar loja
            </button>
          )}
        </div>
      ) : (
        <>
          {isMock && (
            <p className="text-xs text-muted-foreground mb-3 font-semibold">
              Avaliações recentes
            </p>
          )}
          <div className="space-y-3">
            {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        </>
      )}
    </section>
  );
};

// ── Página principal ──────────────────────────────────────────────────────────

const StoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── Ref da seção de avaliações (para scroll) ───────────────────────────────
  const reviewsRef = useRef<HTMLDivElement>(null);
  const [reviewsHighlighted, setReviewsHighlighted] = useState(false);

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setReviewsHighlighted(true);
    setTimeout(() => setReviewsHighlighted(false), 1800);
  };

  // ── Dados da loja ──────────────────────────────────────────────────────────
  const { data: allStores = [], isFetching } = useStores();
  const store = allStores.find((s) => s.id === id);

  // ── Produtos de lojas reais (Supabase) ────────────────────────────────────
  const [supabaseProducts, setSupabaseProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading]   = useState(false);
  const realStore = id ? isSupabaseId(id) : false;

  useEffect(() => {
    if (!id || !realStore) return;
    setProductsLoading(true);
    supabase
      .from("products")
      .select("id, name, description, price, category, image, seller_id")
      .eq("seller_id", id)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) { setProductsLoading(false); return; }
        setSupabaseProducts(
          data.map((p) => ({
            id:          p.id,
            name:        p.name,
            price:       p.price,
            description: p.description ?? "",
            category:    p.category    ?? "",
            image:       p.image       ?? "",
            storeId:     id,
          }))
        );
        setProductsLoading(false);
      });
  }, [id, realStore]);

  const storeProducts: Product[] = realStore
    ? supabaseProducts
    : products.filter((p) => p.storeId === id);

  const { add, count } = useCart();
  const cat = categories.find((c) => c.id === store?.category);

  const { favorited, toggle, loading: favLoading } = useFavorite(
    store
      ? { id: store.id, name: store.name, image: store.image, category: cat?.name ?? store.category }
      : { id: "", name: "" }
  );

  // ── Loading / Not Found ────────────────────────────────────────────────────
  if (!store && isFetching) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Loja não encontrada.</p>
        <button onClick={() => navigate(-1)} className="text-primary mt-2 font-semibold hover:underline">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      {/* Hero — banner + identidade visual */}
      <div className="bg-card rounded-2xl shadow-card mb-6">
        <div className="h-36 lg:h-48 relative overflow-hidden rounded-t-2xl">
          {store.image ? (
            <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ backgroundColor: store.brandColor ? `${store.brandColor}30` : undefined }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <button
            onClick={toggle}
            disabled={favLoading}
            aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            className={`absolute top-3 right-3 size-11 rounded-full backdrop-blur-sm flex items-center justify-center shadow-elevated transition-all active:scale-90 ${
              favorited ? "bg-red-500 text-white" : "bg-black/30 text-white hover:bg-black/50"
            }`}
          >
            <Heart className={`w-5 h-5 ${favorited ? "fill-white" : ""} ${favLoading ? "opacity-50" : ""}`} />
          </button>
        </div>

        <div className="px-5 lg:px-6 pt-0 pb-5 lg:pb-6">
          <div className="flex items-end justify-between gap-4 -mt-8 mb-3 relative z-10">
            <div className="ring-4 ring-card rounded-xl shadow-elevated">
              <StoreLogo store={store} size="xl" whiteBg />
            </div>
            <button
              onClick={toggle}
              disabled={favLoading}
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${
                favorited
                  ? "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-500"
                  : "border-border bg-background hover:border-red-300 hover:text-red-400 text-muted-foreground"
              }`}
            >
              <Heart className={`w-4 h-4 ${favorited ? "fill-red-500 text-red-500" : ""}`} />
              {favorited ? "Favoritada" : "Favoritar"}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl lg:text-3xl font-extrabold">{store.name}</h1>
            {store.verificationStatus === "verificado" && <VerifiedBadge />}
            {store.isLocal && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                🏪 Comércio local
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground">{store.description}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-3">
            {/* ── Rating clicável — leva à seção de avaliações ── */}
            {store.rating > 0 && (
              <button
                onClick={scrollToReviews}
                className="group bg-accent text-accent-foreground px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 hover:bg-yellow-100 hover:text-yellow-800 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-300 transition-colors cursor-pointer"
                title="Ver avaliações"
              >
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span>{store.rating}</span>
                <span className="text-muted-foreground font-normal group-hover:text-yellow-700 dark:group-hover:text-yellow-400">
                  ({store.reviews.toLocaleString("pt-BR")})
                </span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity -ml-0.5" />
              </button>
            )}
            {store.distance !== "—" && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {store.distance}</span>
            )}
            {store.deliveryTime && (
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {store.deliveryTime}</span>
            )}
            {store.address && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {store.address}</span>
            )}
          </div>

          {/* Link "Ver avaliações" explícito (apenas quando há avaliações) */}
          {store.rating > 0 && (
            <button
              onClick={scrollToReviews}
              className="mt-2 text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              Ver avaliações dos clientes <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Produtos */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold">Produtos da loja</h2>
        {count > 0 && (
          <button
            onClick={() => navigate("/cliente/carrinho")}
            className="gradient-brand text-primary-foreground rounded-xl px-4 py-2 font-bold shadow-card text-sm flex items-center gap-2"
          >
            <span className="bg-white/25 px-2 py-0.5 rounded text-xs">{count}</span>
            Ver carrinho
          </button>
        )}
      </div>

      {productsLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : storeProducts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-semibold">Nenhum produto cadastrado ainda</p>
          <p className="text-sm mt-1">Esta loja ainda não adicionou produtos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {storeProducts.map((p) => (
            <div key={p.id} className="bg-card rounded-2xl shadow-card overflow-hidden flex flex-col hover:shadow-elevated transition-all">
              <Link to={`/cliente/produto/${p.id}`} className="block">
                <div className="aspect-square bg-muted">
                  {p.image ? (
                    <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                  )}
                </div>
              </Link>
              <div className="p-3 flex-1 flex flex-col">
                <Link to={`/cliente/produto/${p.id}`}>
                  <p className="text-sm font-semibold leading-tight line-clamp-2 min-h-[40px]">{p.name}</p>
                </Link>
                {"originalPrice" in p && p.originalPrice && (
                  <p className="text-xs text-muted-foreground line-through mt-1">
                    R$ {(p.originalPrice as number).toFixed(2)}
                  </p>
                )}
                <p className="text-base font-extrabold text-primary">R$ {p.price.toFixed(2)}</p>
                {"logistica" in p && <EntregaBadge log={p.logistica as Logistica} />}
                <button
                  onClick={() => add(p)}
                  className="mt-3 gradient-brand text-primary-foreground rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-1 hover:shadow-card transition-shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Seção de avaliações ── */}
      {id && (
        <div ref={reviewsRef}>
          <ReviewsSection
            storeId={id}
            category={store.category}
            storeRating={store.rating}
            storeReviewCount={store.reviews}
            highlighted={reviewsHighlighted}
          />
        </div>
      )}
    </div>
  );
};

export default StoreDetail;
