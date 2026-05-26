import { useRef, useState } from "react";
import { Camera, ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Props = {
  value?: string | null;
  onChange: (url: string) => void;
  folder?: string;
  shape?: "circle" | "rect";
  label?: string;
  className?: string;
};

export const ImagePicker = ({
  value,
  onChange,
  folder = "profile",
  shape = "circle",
  label = "Adicionar foto",
  className = "",
}: Props) => {
  const { user } = useAuth();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);

  const upload = async (file: File) => {
    if (!user) {
      toast.error("Faça login para enviar imagens");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${folder}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Imagem enviada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setBusy(false);
      setMenu(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f);
    e.target.value = "";
  };

  const shapeCls = shape === "circle" ? "rounded-full aspect-square" : "rounded-xl aspect-[3/1]";

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setMenu((v) => !v)}
        className={`w-full ${shapeCls} bg-muted border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-1 overflow-hidden`}
      >
        {busy ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        ) : value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <>
            <Camera className="w-7 h-7 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">{label}</span>
          </>
        )}
      </button>

      {menu && !busy && (
        <div className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 bg-card border border-border rounded-xl shadow-elevated p-1 min-w-[180px]">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm font-semibold"
          >
            <Camera className="w-4 h-4" /> Tirar foto
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm font-semibold"
          >
            <ImageIcon className="w-4 h-4" /> Galeria
          </button>
        </div>
      )}

      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};
