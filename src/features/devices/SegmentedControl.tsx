interface SegmentedControlOption<T extends string> {
  id: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Compact one-click alternative to a select for short option lists — every
 * choice stays visible, the active one is highlighted.
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <fieldset aria-label={label} className="segmented">
      {options.map((option) => (
        <button
          aria-pressed={option.id === value}
          className={
            option.id === value
              ? 'segmented__option segmented__option--active'
              : 'segmented__option'
          }
          key={option.id}
          onClick={() => onChange(option.id)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}
