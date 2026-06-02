import { useState } from "react";
import { Star } from "lucide-react";

type Size = "xs" | "sm" | "md" | "lg";

interface StarRatingProps {
  rating:      number;
  max?:        number;
  size?:       Size;
  interactive?: boolean;
  onChange?:   (rating: number) => void;
  className?:  string;
}

const SIZES: Record<Size, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

export const StarRating = ({
  rating,
  max = 5,
  size = "sm",
  interactive = false,
  onChange,
  className = "",
}: StarRatingProps) => {
  const [hovered, setHovered] = useState(0);
  const cls = SIZES[size];
  const display = interactive && hovered ? hovered : rating;

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1;
        const filled = n <= display;
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onMouseEnter={() => interactive && setHovered(n)}
            onMouseLeave={() => interactive && setHovered(0)}
            onClick={() => interactive && onChange?.(n)}
            className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          >
            <Star
              className={`${cls} transition-colors ${
                filled
                  ? "fill-warning text-warning"
                  : "fill-transparent text-muted-foreground/30"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

/** Barra proporcional para exibição da distribuição de notas. */
export const RatingBar = ({
  stars, count, total,
}: { stars: number; count: number; total: number }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right font-semibold text-muted-foreground">{stars}</span>
      <Star className="w-3 h-3 fill-warning text-warning shrink-0" />
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-warning rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-5 text-muted-foreground">{count}</span>
    </div>
  );
};
