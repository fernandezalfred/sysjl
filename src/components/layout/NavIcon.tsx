// Small line icons for the panel navigation (24×24 viewBox, drawn with currentColor so
// they follow the link's text color).
export type NavIconName = "dashboard" | "charts" | "finance" | "account" | "users" | "grains" | "home" | "signOut";

const PATHS: Record<NavIconName, string[]> = {
  dashboard: ["M4 4h7v7H4z", "M13 4h7v4h-7z", "M13 10h7v10h-7z", "M4 13h7v7H4z"],
  charts: ["M4 20V10", "M10 20V4", "M16 20v-7", "M22 20H2"],
  finance: ["M3 17l6-6 4 4 8-8", "M15 7h6v6"],
  account: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 20a8 8 0 0 1 16 0"],
  users: [
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
    "M2.5 20a6.5 6.5 0 0 1 13 0",
    "M16 4.3a3.5 3.5 0 0 1 0 6.4",
    "M18 14a6.5 6.5 0 0 1 3.5 6",
  ],
  grains: ["M12 21V9", "M12 9c0-3 2-5 5-5 0 3-2 5-5 5z", "M12 9c0-3-2-5-5-5 0 3 2 5 5 5z", "M12 15c0-3 2-5 5-5 0 3-2 5-5 5z", "M12 15c0-3-2-5-5-5 0 3 2 5 5 5z"],
  home: ["M3 11l9-7 9 7", "M5 9.5V20h14V9.5", "M10 20v-5h4v5"],
  signOut: ["M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3", "M10 16l-4-4 4-4", "M6 12h10"],
};

export function NavIcon({ name, className = "h-4 w-4" }: { name: NavIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
