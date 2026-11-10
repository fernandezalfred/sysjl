// The "JL" logo square, shared by the landing page and the panel sidebar.
export function BrandMark({ size = "md" }: { size?: "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-10 w-10 rounded-xl text-sm" : "h-8 w-8 rounded-lg text-xs";
  return (
    <span
      aria-hidden="true"
      className={`flex flex-shrink-0 items-center justify-center bg-gradient-to-br from-sky-500 to-indigo-600 font-bold text-white shadow-md shadow-sky-600/20 ${sizeClass}`}
    >
      JL
    </span>
  );
}
