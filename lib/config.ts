export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/\/$/, "");
  if (vercelProduction) return `https://${vercelProduction}`;
  const vercelUrl = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercelUrl) return `https://${vercelUrl}`;
  return "http://localhost:3000";
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!key || key.length < 40 || /your-anon/i.test(key)) return false;

  try {
    const parsed = new URL(url);
    if (/YOUR_PROJECT/i.test(parsed.hostname)) return false;
    const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    const hosted = parsed.hostname.endsWith(".supabase.co");
    if (local) return parsed.protocol === "http:" || parsed.protocol === "https:";
    return parsed.protocol === "https:" && hosted;
  } catch {
    return false;
  }
}

export function isPricingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PRICING_ENABLED === "true";
}

export function getDonationUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_DONATION_URL?.trim();
  return url || undefined;
}
