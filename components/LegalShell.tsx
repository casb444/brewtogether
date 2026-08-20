import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { SiteFooter } from "./SiteFooter";

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <nav className="h-14 flex items-center justify-between px-6 border-b border-border">
        <BrandMark />
        <Link href="/" className="text-[13px] text-ink-soft hover:text-brand">
          Back to the café
        </Link>
      </nav>
      <article className="flex-1 max-w-2xl mx-auto px-6 py-12">
        <p className="text-[11px] uppercase tracking-wider text-brand font-semibold mb-3">BrewTogether</p>
        <h1 className="font-display text-4xl text-ink mb-2">{title}</h1>
        <p className="text-xs text-ink-muted mb-8">Last updated {updated}</p>
        <div className="space-y-5 text-sm text-ink-soft leading-relaxed">{children}</div>
      </article>
      <SiteFooter />
    </div>
  );
}
