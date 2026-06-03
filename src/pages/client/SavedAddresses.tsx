import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Plus, Pencil, Trash2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Address = {
  id: string;
  label: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  complement: string;
  is_default: boolean;
};

const empty: Omit<Address, "id" | "is_default"> = {
  label: "Casa",
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  zip_code: "",
  complement: "",
};

export default function SavedAddresses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[SavedAddresses] erro ao carregar:", error);
      toast.error("Não foi possível carregar seus endereços");
      setLoading(false);
      return;
    }

    // Se não há endereços, verifica se o perfil tem dados de endereço
    // salvos em extras durante o cadastro e os migra automaticamente.
    if (!data || data.length === 0) {
      const migrated = await migrateFromProfile(user.id);
      setAddresses(migrated);
    } else {
      setAddresses(data as Address[]);
    }

    setLoading(false);
  };

  // Migra endereço do campo extras do perfil (preenchido no cadastro)
  // para a tabela addresses. Roda apenas uma vez por usuário.
  const migrateFromProfile = async (userId: string): Promise<Address[]> => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("extras")
        .eq("id", userId)
        .maybeSingle();

      const extras = profile?.extras as Record<string, string> | null;
      const hasAddress = extras && (extras.address || extras.city);
      if (!hasAddress) return [];

      const { data: inserted, error: insertErr } = await supabase
        .from("addresses")
        .insert({
          user_id: userId,
          label: "Casa",
          street: extras.address || "",
          number: "",
          neighborhood: "",
          city: extras.city || "",
          state: "",
          zip_code: "",
          complement: extras.reference || "",
          is_default: true,
        })
        .select("*");

      if (insertErr) {
        console.error("[SavedAddresses] erro ao migrar endereço do perfil:", insertErr);
        return [];
      }

      return (inserted as Address[]) || [];
    } catch (e) {
      console.error("[SavedAddresses] migrateFromProfile:", e);
      return [];
    }
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const openNew = () => { setEditing(null); setForm(empty); setShowForm(true); };

  const openEdit = (a: Address) => {
    setEditing(a);
    setForm({
      label: a.label,
      street: a.street,
      number: a.number,
      neighborhood: a.neighborhood,
      city: a.city,
      state: a.state,
      zip_code: a.zip_code,
      complement: a.complement,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!user) return;
    if (!form.street || !form.city) {
      toast.error("Preencha ao menos rua e cidade");
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from("addresses")
        .update({ ...form })
        .eq("id", editing.id);
      if (error) {
        console.error("[SavedAddresses] erro ao atualizar:", error);
        toast.error("Erro ao salvar endereço");
        setSaving(false);
        return;
      }
      toast.success("Endereço atualizado!");
    } else {
      const isFirst = addresses.length === 0;
      const { error } = await supabase
        .from("addresses")
        .insert({ ...form, user_id: user.id, is_default: isFirst });
      if (error) {
        console.error("[SavedAddresses] erro ao inserir:", error);
        toast.error("Erro ao salvar endereço");
        setSaving(false);
        return;
      }
      toast.success("Endereço adicionado!");
    }
    setSaving(false);
    setShowForm(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) {
      console.error("[SavedAddresses] erro ao remover:", error);
      toast.error("Erro ao remover endereço");
      return;
    }
    toast.success("Endereço removido");
    load();
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);
    await supabase
      .from("addresses")
      .update({ is_default: true })
      .eq("id", id);
    load();
  };

  const [cepLoading, setCepLoading] = useState(false);

  const handleCepBlur = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) { toast.error("CEP não encontrado"); return; }
      setForm((f) => ({
        ...f,
        street: data.logradouro || f.street,
        neighborhood: data.bairro || f.neighborhood,
        city: data.localidade || f.city,
        state: data.uf || f.state,
      }));
      toast.success("Endereço preenchido automaticamente!");
    } catch {
      toast.error("Não foi possível buscar o CEP");
    } finally {
      setCepLoading(false);
    }
  };

  const field = (
    label: string,
    key: keyof typeof form,
    placeholder?: string,
    half?: boolean,
  ) => (
    <label className={`flex flex-col gap-1 ${half ? "flex-1" : "w-full"}`}>
      <span className="text-xs font-bold text-muted-foreground">
        {label}
        {key === "zip_code" && cepLoading && (
          <span className="ml-1 text-primary text-[10px]">buscando...</span>
        )}
      </span>
      <input
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        onBlur={key === "zip_code" ? (e) => handleCepBlur(e.target.value) : undefined}
        placeholder={placeholder}
        className="bg-muted rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="size-10 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-extrabold">Endereços salvos</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.length === 0 && !showForm && (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Nenhum endereço salvo</p>
              <p className="text-sm mt-1">
                Adicione um endereço para agilizar seus pedidos
              </p>
            </div>
          )}

          {addresses.map((a) => (
            <div key={a.id} className="bg-card rounded-2xl shadow-card p-4 flex gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {a.label}
                  </span>
                  {a.is_default && (
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                      <Star className="w-3 h-3" /> Padrão
                    </span>
                  )}
                </div>
                <p className="font-semibold text-sm">
                  {a.street}{a.number ? `, ${a.number}` : ""}
                  {a.complement ? ` — ${a.complement}` : ""}
                </p>
                {a.neighborhood && (
                  <p className="text-xs text-muted-foreground">{a.neighborhood}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {a.city}
                  {a.state ? ` — ${a.state}` : ""}
                  {a.zip_code ? `, ${a.zip_code}` : ""}
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                {!a.is_default && (
                  <button
                    onClick={() => setDefault(a.id)}
                    className="text-xs text-amber-500 font-bold hover:underline"
                  >
                    Padrão
                  </button>
                )}
                <button
                  onClick={() => openEdit(a)}
                  className="text-primary hover:bg-primary/10 rounded-lg p-1.5 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(a.id)}
                  className="text-destructive hover:bg-destructive/10 rounded-lg p-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {showForm && (
            <div className="bg-card rounded-2xl shadow-card p-5 space-y-3">
              <h2 className="font-bold text-base">
                {editing ? "Editar endereço" : "Novo endereço"}
              </h2>
              <div className="flex gap-3">
                {field("Rótulo", "label", "Casa, Trabalho...", true)}
                {field("CEP", "zip_code", "00000-000", true)}
              </div>
              {field("Rua / Avenida", "street", "Ex: Rua das Flores")}
              <div className="flex gap-3">
                {field("Número", "number", "Ex: 123", true)}
                {field("Complemento", "complement", "Apto, bloco...", true)}
              </div>
              {field("Bairro", "neighborhood", "Ex: Centro")}
              <div className="flex gap-3">
                {field("Cidade", "city", "Ex: São Paulo", true)}
                {field("Estado", "state", "Ex: SP", true)}
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border border-border font-bold text-sm hover:bg-muted/40"
                >
                  Cancelar
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl gradient-brand text-primary-foreground font-bold text-sm disabled:opacity-60"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          )}

          {!showForm && (
            <button
              onClick={openNew}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="w-5 h-5" /> Adicionar endereço
            </button>
          )}
        </div>
      )}
    </div>
  );
}
