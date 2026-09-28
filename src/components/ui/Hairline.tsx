export function Hairline({ onBone = false, className = "" }: { onBone?: boolean; className?: string }) {
  return (
    <hr className={`h-px border-0 ${onBone ? "bg-line-bone" : "bg-line"} ${className}`} />
  );
}
