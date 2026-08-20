import Link from "next/link";

export function BrandMark({ className = "text-xl" }: { className?: string }) {
  return (
    <Link href="/" className={`font-display italic text-ink ${className}`}>
      brew<span className="text-brand not-italic">together</span>
    </Link>
  );
}
