import { copy, type CopyKey } from "@/lib/copy";

export function TextMarks({ k }: { k: CopyKey }) {
  const parts = copy(k)
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
  return (
    <div className="marks">
      {parts.map((part) => (
        <span key={part}>{part}</span>
      ))}
    </div>
  );
}
