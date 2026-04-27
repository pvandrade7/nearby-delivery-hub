import { BadgeCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const VerifiedBadge = ({ className, compact = false }: { className?: string; compact?: boolean }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full bg-success/15 text-success font-extrabold border border-success/20",
      compact ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
      className
    )}
  >
    <BadgeCheck className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
    Verificado
  </span>
);

export const VerifiedCheckIcon = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "inline-flex size-4 items-center justify-center rounded-full bg-success/15 text-success border border-success/20 shrink-0",
      className
    )}
    aria-label="Loja verificada"
    title="Loja verificada"
  >
    <Check className="w-3 h-3" strokeWidth={3} />
  </span>
);
