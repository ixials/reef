import { useState } from "react";

interface StarRatingProps {
  rating: number;
  onChange?: (r: number) => void;
  size?: number;
}

export function StarRating({ rating, onChange, size = 18 }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover !== null ? hover : rating;
  return (
    <span
      className="inline-flex gap-px"
      style={{ cursor: onChange ? "pointer" : "default" }}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const full = display >= n;
        const half = !full && display >= n - 0.5;
        const id = `h${n}`;
        return (
          <span
            key={n}
            className="relative inline-block"
            style={{ width: size, height: size }}
            onMouseLeave={() => onChange && setHover(null)}
          >
            <svg width={size} height={size} viewBox="0 0 20 20">
              <defs>
                <linearGradient id={id}>
                  <stop offset="50%" stopColor="#E84832" />
                  <stop offset="50%" stopColor="#D8D6D0" />
                </linearGradient>
              </defs>
              <polygon
                points="10,1 12.9,7 19.5,7.6 14.5,12 16.2,18.5 10,15 3.8,18.5 5.5,12 0.5,7.6 7.1,7"
                fill={full ? "#E84832" : half ? `url(#${id})` : "#D8D6D0"}
              />
            </svg>
            {onChange && (
              <>
                <span
                  className="absolute left-0 top-0 w-1/2 h-full z-10"
                  onMouseEnter={() => setHover(n - 0.5)}
                  onClick={() => onChange(n - 0.5)}
                />
                <span
                  className="absolute right-0 top-0 w-1/2 h-full z-10"
                  onMouseEnter={() => setHover(n)}
                  onClick={() => onChange(n)}
                />
              </>
            )}
          </span>
        );
      })}
    </span>
  );
}
