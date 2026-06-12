interface ClearUrlButtonProps {
  onClear: () => void;
}

/** The × at the end of a URL input — rendered only while there is text. */
export function ClearUrlButton({ onClear }: ClearUrlButtonProps) {
  return (
    <button
      aria-label="Clear the test URL"
      className="url-field__clear"
      onClick={onClear}
      title="Clear the test URL"
      type="button"
    >
      <svg aria-hidden="true" fill="none" height="12" viewBox="0 0 14 14" width="12">
        <path
          d="M3 3l8 8M11 3l-8 8"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.6"
        />
      </svg>
    </button>
  );
}
