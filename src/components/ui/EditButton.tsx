interface EditButtonProps {
  label: string;
  onClick: () => void;
}

// The "Edit" action on every records/purchases list (Sale Records, Totals by User,
// Milk, Grains): just a pencil icon (no border, background or text) that turns blue
// on hover. The label is the tooltip and the accessible name; -m-2 p-2 widens the
// tap area without shifting the layout.
export function EditButton({ label, onClick }: EditButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="-m-2 inline-flex cursor-pointer items-center justify-center p-2 text-foreground/70 transition-colors hover:text-sky-700 dark:hover:text-sky-300"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    </button>
  );
}
