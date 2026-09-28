import { TAG_COLORS } from "@/components/ui/Tag";

/** Covers are an uploaded image, or a soft color band stored as "color:blue". */
export const COVER_COLORS = TAG_COLORS;

export function coverStyle(cover: string | null | undefined): React.CSSProperties | null {
  if (!cover) return null;
  if (cover.startsWith("color:")) return { background: `var(--tag-${cover.slice(6)}-bg)` };
  return { backgroundImage: `url(${JSON.stringify(cover)})`, backgroundSize: "cover", backgroundPosition: "center" };
}

/** A small, calm set of page icons. Anyone can also type their own character. */
export const ICONS = [
  "📄", "📘", "📗", "📕", "📙", "🗂️", "📌", "📝", "🎯", "✅", "🧭", "💡",
  "🔍", "📈", "📊", "🗓️", "🤝", "👥", "🧪", "🛠️", "🏭", "⚖️", "📣", "💬",
  "🧾", "🌊", "🌱", "🍞", "🩺", "🧰", "🎨", "🚀", "📦", "🔒", "⭐", "🧠",
];
