interface BrandMarkProps {
  size?: number;
  className?: string;
}

/** Square grid coordinates: 4 cells of 4 units with 1-unit gaps. */
const CELL_POSITIONS = [0, 5, 10, 15];
const FILLED_ROWS = [1, 2];

/**
 * The brand mark: a 4×4 grid where only the two middle rows are filled —
 * the effective viewport between the chrome at the top and bottom.
 */
export function BrandMark({ size = 14, className }: BrandMarkProps) {
  return (
    <svg aria-hidden="true" className={className} height={size} viewBox="0 0 19 19" width={size}>
      {CELL_POSITIONS.map((y, rowIndex) =>
        CELL_POSITIONS.map((x) =>
          FILLED_ROWS.includes(rowIndex) ? (
            <rect fill="currentColor" height="4" key={`${x}-${y}`} width="4" x={x} y={y} />
          ) : (
            <rect
              fill="none"
              height="3"
              key={`${x}-${y}`}
              stroke="currentColor"
              width="3"
              x={x + 0.5}
              y={y + 0.5}
            />
          ),
        ),
      )}
    </svg>
  );
}
