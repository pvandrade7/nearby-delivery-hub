import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, MessageCircle } from "lucide-react";

type Row = {
  id: string;
  product_id: string;
  product_name: string | null;
  product_image: string | null;
  last_message: string | null;
  last_message_at: string;
  buyer_id: string;
  seller_id: string | null;
  unread: number;
};

const Conversations = () => {
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { state: { from: "/cliente/conversas" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, product_id, product_name, product_image, last_message, last_message_at, buyer_id, seller_id")
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      const list = data ?? [];
      const withUnread: Row[] = await Promise.all(
        list.map(async (c) => {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", c.id)
            .neq("sender_id", user.id)
            .is("read_at", null);
          return { ...c, unread: count ?? 0 };
        })
      );
      if (!cancelled) {
        setRows(withUnread);
        setBusy(false);
      }
    };
    void load();

    const channel = supabase
      .channel("conv-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, load)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user]);

  if (!user) return null;

  return (
    <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <h1 className="text-2xl font-extrabold mb-4">Conversas</h1>

      {busy && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {!busy && rows.length === 0 && (
        <div className="bg-card rounded-2xl shadow-card p-8 text-center">
          <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Você ainda não iniciou conversas.</p>
        </div>
      )}

      <ul className="space-y-2">
        {rows.map((c) => (
          <li key={c.id}>
            <Link
              to={`/cliente/chat/${c.product_id}`}
              className="flex items-center gap-3 bg-card rounded-2xl shadow-card p-4 hover:shadow-elevated transition-shadow"
            >
              {c.product_image ? (
                <img src={c.product_image} alt="" className="size-14 rounded-xl object-cover bg-muted" />
              ) : (
                <div className="size-14 rounded-xl bg-muted" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{c.product_name ?? "Produto"}</p>
                <p className="text-sm text-muted-foreground truncate">{c.last_message ?? "Nenhuma mensagem"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">
                  {new Date(c.last_message_at).toLocaleDateString()}
                </p>
                {c.unread > 0 && (
                  <span className="inline-block mt-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-2 py-0.5">
                    {c.unread}
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Conversations;
