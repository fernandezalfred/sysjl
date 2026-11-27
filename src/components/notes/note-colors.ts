import type { NoteColorName } from "@/lib/notes";

interface NoteColorStyle {
  // The card: background, border and the hover ring.
  card: string;
  // The round swatch in the form's color picker.
  swatch: string;
  // Translation key of its name (swatch label for screen readers).
  label: string;
}

export const NOTE_COLOR_STYLES: Record<NoteColorName, NoteColorStyle> = {
  DEFAULT: {
    card: "border-foreground/10 bg-foreground/[0.03] hover:border-foreground/25",
    swatch: "bg-background border-foreground/30",
    label: "notes.colorDefault",
  },
  AMBER: {
    card: "border-amber-500/30 bg-amber-500/10 hover:border-amber-500/60",
    swatch: "bg-amber-400 border-amber-500",
    label: "notes.colorAmber",
  },
  SKY: {
    card: "border-sky-500/30 bg-sky-500/10 hover:border-sky-500/60",
    swatch: "bg-sky-400 border-sky-500",
    label: "notes.colorSky",
  },
  EMERALD: {
    card: "border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/60",
    swatch: "bg-emerald-400 border-emerald-500",
    label: "notes.colorEmerald",
  },
  ROSE: {
    card: "border-rose-500/30 bg-rose-500/10 hover:border-rose-500/60",
    swatch: "bg-rose-400 border-rose-500",
    label: "notes.colorRose",
  },
  VIOLET: {
    card: "border-violet-500/30 bg-violet-500/10 hover:border-violet-500/60",
    swatch: "bg-violet-400 border-violet-500",
    label: "notes.colorViolet",
  },
};
