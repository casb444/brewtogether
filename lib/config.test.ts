import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl, isSupabaseConfigured } from "./config";

describe("isSupabaseConfigured", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects placeholder credentials", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://YOUR_PROJECT_REF.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "your-anon-public-key");
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("accepts a hosted Supabase project", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcdefghijklmnop.supabase.co");
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.local-test-key-value"
    );
    expect(isSupabaseConfigured()).toBe(true);
  });
});

describe("getSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://brewtogether.example/");
    expect(getSiteUrl()).toBe("https://brewtogether.example");
  });
});
