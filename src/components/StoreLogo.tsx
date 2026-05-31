import { useState } from "react";
import type { Store } from "@/data/mockData";

type Props = {
  store: Pick<Store, "name" | "logo" | "brandColor">;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Se true, renderiza num quadrado com fundo branco — ideal para logos coloridas */
  whiteBg?: boolean;
};

const SIZE: Record<NonNullable<Props["size"]>, string> = {
  xs: "size-8  text-sm",
  sm: "size-12 text-base",
  md: "size-16 text-lg",
  lg: "size-20 text-xl",
  xl: "size-28 text-2xl",
};

/**
 * Exibe o logotipo oficial da loja (via URL `logo`).
 * Se a imagem não carregar ou não existir, mostra as iniciais
 * da loja sobre o fundo na cor da marca (`brandColor`).
 */
export const StoreLogo = ({
  store,
  size = "md",
  className = "",
  whiteBg = false,
}: Props) => {
  const [error, setError] = useState(false);

  // Iniciais (até 2 letras)
  const initials = store.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const sizeClass = SIZE[size];
  const rounded = "rounded-xl";

  if (store.logo && !error) {
    return (
      <div
        className={`${sizeClass} ${rounded} overflow-hidden flex items-center justify-center shrink-0 ${
          whiteBg ? "bg-white border border-border p-1.5" : "bg-white p-1.5"
        } ${className}`}
      >
        <img
          src={store.logo}
          alt={`Logo ${store.name}`}
          className="w-full h-full object-contain"
          onError={() => setError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback: iniciais com cor da marca
  return (
    <div
      className={`${sizeClass} ${rounded} flex items-center justify-center shrink-0 font-extrabold text-white select-none ${className}`}
      style={{ backgroundColor: store.brandColor ?? "#6366F1" }}
    >
      {initials}
    </div>
  );
};
