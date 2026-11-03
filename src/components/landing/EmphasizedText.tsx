import { Fragment } from "react";

interface EmphasizedTextProps {
  template: string;
  values: Record<string, string | number>;
  // Placeholders to render in bold; any other placeholder is substituted as plain text.
  emphasize: string[];
}

const PLACEHOLDER = /\{(\w+)\}/g;

// Renders a raw translation template (e.g. "{taken} taken · {remaining} left"),
// substituting each {placeholder} with its value and bolding the ones listed
// in `emphasize` so they stand out from the surrounding words.
export function EmphasizedText({ template, values, emphasize }: EmphasizedTextProps) {
  const parts = template.split(PLACEHOLDER);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        const value = String(values[part] ?? `{${part}}`);
        return emphasize.includes(part) ? (
          <strong key={i} className="font-semibold text-foreground">
            {value}
          </strong>
        ) : (
          <Fragment key={i}>{value}</Fragment>
        );
      })}
    </>
  );
}
