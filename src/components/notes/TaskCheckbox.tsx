"use client";

interface TaskCheckboxProps {
  done: boolean;
  label: string;
  onToggle: () => void;
}

// A Notion-style square checkbox: empty outline, blue with a check mark when done.
export function TaskCheckbox({ done, label, onToggle }: TaskCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      title={label}
      onClick={onToggle}
      // A 40px tap target around the small square.
      className="group/check -m-2.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-sky-500 sm:-m-2 sm:h-8 sm:w-8"
    >
      <span
        aria-hidden="true"
        className={`flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border-[1.5px] transition ${
          done ? "border-sky-600 bg-sky-600 text-white" : "border-foreground/40 group-hover/check:border-foreground/70 group-hover/check:bg-foreground/5"
        }`}
      >
        {done ? (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
        ) : null}
      </span>
    </button>
  );
}
