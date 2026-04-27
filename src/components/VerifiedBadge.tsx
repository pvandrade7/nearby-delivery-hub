import { BadgeCheck } from "lucide-react";
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
