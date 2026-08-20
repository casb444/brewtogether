import Link from "next/link";

export function ConfigBanner() {
  return (
    <div className="mb-4 rounded-xl border border-border bg-brand-light px-4 py-3 text-sm text-ink-mid">
      The café backend is not connected yet. You can look around the public pages, but sign-in needs a configured Supabase project. See{" "}
      <Link href="/support" className="underline text-brand">
        setup notes
      </Link>
      .
    </div>
  );
}
