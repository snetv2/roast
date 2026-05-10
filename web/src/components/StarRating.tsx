type Props = {
  value: number | null;
  onChange?: (v: number | null) => void;
  size?: number;
};

export function StarRating({ value, onChange, size = 22 }: Props) {
  const readOnly = !onChange;
  return (
    <div className="stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = value !== null && n <= value;
        return (
          <button
            key={n}
            type="button"
            className={`star ${filled ? "filled" : ""} ${readOnly ? "ro" : ""}`}
            disabled={readOnly}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => onChange?.(value === n ? null : n)}
          >
            {filled ? "★" : "☆"}
          </button>
        );
      })}
    </div>
  );
}
