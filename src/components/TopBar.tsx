import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

export const TopBar = ({
  title,
  right,
  onBack,
}: {
  title?: string;
  right?: ReactNode;
  onBack?: () => void;
}) => {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 h-14 flex items-center gap-3">
      <button
        onClick={() => (onBack ? onBack() : navigate(-1))}
        className="size-9 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Voltar"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      {title && <h1 className="flex-1 font-bold text-base truncate">{title}</h1>}
      {right}
    </header>
  );
};
