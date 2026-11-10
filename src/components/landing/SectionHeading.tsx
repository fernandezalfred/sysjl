interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
}

// A landing section's heading: a small colored label, the title and an optional line.
export function SectionHeading({ id, eyebrow, title, subtitle }: SectionHeadingProps) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">{eyebrow}</p>
      <h2 id={id} className="mt-2 text-2xl font-bold tracking-tight text-balance sm:text-3xl">
        {title}
      </h2>
      {subtitle ? <p className="mt-3 text-base text-foreground/70">{subtitle}</p> : null}
    </div>
  );
}
