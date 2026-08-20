"use client";

import Link from "next/link";
import { Button } from "@/components/Button";
import { SiteFooter } from "@/components/SiteFooter";
import { getDonationUrl, isPricingEnabled } from "@/lib/config";
import type { Room } from "@/types/database";

interface LandingClientProps {
  isAuthed: boolean;
  isAnonymous?: boolean;
  rooms: Room[];
  backendReady: boolean;
  sessionCount: number;
}

const STRIP_PEOPLE = [
  { av: "AS", bg: "#E6EEF8", c: "#1A4C8A", task: "algorithms problem set" },
  { av: "MW", bg: "#E0F3EC", c: "#0C5C3A", task: "thesis chapter 2" },
  { av: "KB", bg: "#FAF0DC", c: "#7A4E0A", task: "economics reading" },
  { av: "TN", bg: "#EEECFE", c: "#4A3FAA", task: "ML notes" },
  { av: "PK", bg: "#FAE8E4", c: "#8A2C18", task: "essay draft" },
  { av: "JW", bg: "#FAE6F0", c: "#8A2550", task: "just for company" },
  { av: "YH", bg: "#E8F2DC", c: "#2E5C0A", task: "japanese grammar" },
  { av: "RA", bg: "#FDF0E8", c: "#7C4B1A", task: "data structures" },
];

const FEATURES = [
  { icon: "🫂", title: "Body doubling, digitally", desc: "Working near others — even silently — reduces procrastination. The presence feed recreates that effect." },
  { icon: "🍅", title: "Built-in Pomodoro timer", desc: "25, 50, or 90-minute sessions. Progress is tracked, your streak grows, and the café cheers you on." },
  { icon: "💬", title: "Murmurs — not a chat", desc: "Drop a quiet thought. See what others are thinking. No replies, no threads. Just shared humanity." },
  { icon: "🏛️", title: "Multiple rooms", desc: "The main café, a late-night library, a rainy window nook, plus study groups you can create." },
  { icon: "🔥", title: "Streaks that mean something", desc: "Your daily streak is stored on the server. Accountability without a public leaderboard." },
  { icon: "🔇", title: "Optional ambience", desc: "Soft rain, a lo-fi pad, library hush, or silence — generated in the browser, and easy to turn off." },
];

const STEPS = [
  { num: 1, title: "Walk in", desc: "Open BrewTogether and see who's already here. Type what you're working on — it shows up in the presence feed." },
  { num: 2, title: "Start your timer", desc: "Hit start on the Pomodoro. Work while the café keeps you company. Completed sessions count toward your streak." },
  { num: 3, title: "Leave a murmur", desc: "When you finish, drop a quiet thought in the Murmurs stream. One line. No replies. A small record you were here." },
];

export function LandingClient({ isAuthed, isAnonymous = false, rooms, backendReady, sessionCount }: LandingClientProps) {
  const pricingEnabled = isPricingEnabled();
  const donationUrl = getDonationUrl();
  const cafeHref = isAnonymous ? "/groups" : "/cafe/main";
  const primaryHref = isAuthed ? cafeHref : "/signup";
  const proof = ["No camera needed", "Free during launch", "Works on any device"];
  if (sessionCount > 0) proof.push(`${sessionCount.toLocaleString()}+ sessions logged`);

  return (
    <div className="bg-parchment min-h-screen">
      <nav className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border bg-parchment sticky top-0 z-50 gap-3">
        <div className="font-display italic text-lg text-ink shrink-0">
          brew<span className="text-brand not-italic">together</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href={isAuthed ? "/groups" : "/signup"} className="text-[13px] text-ink-soft hover:text-brand transition-colors hidden sm:block">
            Study groups
          </Link>
          {isAuthed ? (
            <Button href={cafeHref} variant="primary" size="sm">
              <span className="sm:hidden">Enter</span>
              <span className="hidden sm:inline">{isAnonymous ? "Back to your group →" : "Enter the café →"}</span>
            </Button>
          ) : (
            <>
              <Link href="/login" className="text-[13px] text-ink-soft hover:text-brand transition-colors hidden sm:block">
                Sign in
              </Link>
              <Button href="/signup" variant="primary" size="sm">
                <span className="sm:hidden">Join</span>
                <span className="hidden sm:inline">Join the café →</span>
              </Button>
            </>
          )}
        </div>
      </nav>

      {!backendReady && (
        <div className="px-4 sm:px-6 py-3 bg-brand-light border-b border-border text-sm text-ink-mid text-center leading-snug">
          Public rooms appear after the café backend is connected. You can still read how it works below.
        </div>
      )}

      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-14 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, #D9C4A8, transparent)" }} />
        <div className="relative inline-flex items-center gap-2 px-3.5 py-1 bg-brand-light border border-border rounded-full text-xs font-medium text-brand uppercase tracking-wide mb-6">
          Free during launch
        </div>
        <h1 className="relative font-display font-medium text-[2.2rem] sm:text-6xl leading-[1.12] text-ink max-w-[680px] mb-5 -tracking-[0.01em]">
          The café where <br className="hidden sm:block" />
          <em className="italic text-brand">strangers study together</em>
        </h1>
        <p className="relative text-base text-ink-soft max-w-[480px] leading-[1.75] mb-9">
          No video. No conversation. No pressure. Just the warm feeling of not being alone while you get things done.
        </p>
        <div className="relative flex gap-3 justify-center flex-wrap mb-10">
          <Button href={primaryHref} variant="primary" size="lg">
            Find a seat →
          </Button>
          <Button href="#how" variant="outline" size="lg">
            How it works
          </Button>
        </div>
        <div className="relative flex items-center gap-6 flex-wrap justify-center text-[13px] text-ink-soft">
          {proof.map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <div className="w-[5px] h-[5px] rounded-full bg-brand-mid" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <div className="relative bg-cream2 border-y border-border py-3.5 overflow-hidden">
        <p className="sr-only">Example of the kinds of tasks people bring to the café.</p>
        <div className="flex gap-2.5 animate-scroll-strip w-max pl-40">
          {[...STRIP_PEOPLE, ...STRIP_PEOPLE].map((person, index) => (
            <div key={index} className="flex items-center gap-2 px-3.5 py-1.5 bg-parchment border border-border rounded-full text-xs text-ink-mid whitespace-nowrap flex-shrink-0">
              <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ background: person.bg, color: person.c }}>
                {person.av}
              </div>
              {person.task}
            </div>
          ))}
        </div>
      </div>

      <section className="px-6 py-16 max-w-[1080px] mx-auto">
        <p className="text-[11px] uppercase tracking-wider text-brand font-semibold mb-3">Why it works</p>
        <h2 className="font-display text-3xl sm:text-4xl text-ink mb-4">Designed around how humans actually focus</h2>
        <p className="text-[15px] text-ink-soft max-w-[520px] leading-[1.75] mb-12">
          Research shows ambient social presence reduces procrastination. BrewTogether puts that science to work — without the awkwardness of a video call.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="bg-parchment border border-border rounded-2xl p-7 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-brand-mid">
              <div className="text-2xl mb-4">{feature.icon}</div>
              <div className="font-semibold text-[15px] text-ink mb-2">{feature.title}</div>
              <div className="text-sm text-ink-soft leading-[1.7]">{feature.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-cream2 px-6 py-16">
        <div className="max-w-[1080px] mx-auto">
          <p className="text-[11px] uppercase tracking-wider text-brand font-semibold mb-3">The rooms</p>
          <h2 className="font-display text-3xl sm:text-4xl text-ink mb-4">Find your spot</h2>
          {rooms.length === 0 ? (
            <p className="text-sm text-ink-soft mt-6 max-w-xl">
              {backendReady
                ? "No public rooms are published yet. After you sign in you can still create a study group."
                : "Café rooms load from the database. Connect Supabase and apply the migrations to see the Main Café, Library, and more."}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
              {rooms.map((room) => (
                <Link key={room.id} href={`/cafe/${room.id}`} className="rounded-2xl overflow-hidden border border-border cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-lg block">
                  <div className="h-28 flex items-center justify-center text-4xl relative" style={{ background: "linear-gradient(135deg,#F0E0C8,#E8D0B0)" }}>
                    {room.icon}
                  </div>
                  <div className="bg-parchment p-4">
                    <div className="font-semibold text-sm text-ink mb-0.5">{room.name}</div>
                    <div className="text-xs text-ink-soft">{room.description}</div>
                    <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-green/10 text-green">
                      Free during launch
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="how" className="px-6 py-16 max-w-[860px] mx-auto">
        <p className="text-[11px] uppercase tracking-wider text-brand font-semibold mb-3">Getting started</p>
        <h2 className="font-display text-3xl sm:text-4xl text-ink mb-4">Three steps, then just work</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-10">
          {STEPS.map((step) => (
            <div key={step.num}>
              <div className="w-9 h-9 rounded-full bg-brand-light border border-border flex items-center justify-center text-sm font-semibold text-brand mb-4">
                {step.num}
              </div>
              <div className="font-semibold text-[15px] text-ink mb-2">{step.title}</div>
              <div className="text-sm text-ink-soft leading-[1.7]">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {pricingEnabled && <PricingSection href={primaryHref} />}

      {!pricingEnabled && (
        <section className="bg-cream2 px-6 py-14 text-center">
          <h2 className="font-display text-3xl text-ink mb-3">Free to focus, together</h2>
          <p className="text-sm text-ink-soft max-w-[520px] mx-auto mb-5">
            BrewTogether is free during launch. If it helps your study practice, a small donation helps keep the café warm — and never unlocks extra rooms.
          </p>
          {donationUrl ? (
            <Button href={donationUrl} variant="outline" target="_blank" rel="noreferrer">
              ☕ Buy us a coffee
            </Button>
          ) : (
            <span className="text-xs text-ink-muted">Donations will open when we publish an external support link.</span>
          )}
        </section>
      )}

      <section className="px-6 py-20 text-center" style={{ background: "linear-gradient(160deg, var(--cream) 0%, var(--brand-light) 100%)" }}>
        <h2 className="font-display text-3xl sm:text-5xl text-ink mb-4">Your seat is waiting.</h2>
        <p className="text-[15px] text-ink-soft max-w-[440px] mx-auto mb-8">
          Walk in, start a timer, and study next to whoever else showed up. No camera. No small talk.
        </p>
        <Button href={primaryHref} variant="primary" size="lg">
          Join the café — it&apos;s free →
        </Button>
      </section>

      <SiteFooter donationUrl={donationUrl} roomLinks={rooms.map((room) => [room.name, `/cafe/${room.id}`])} />
    </div>
  );
}

function PricingSection({ href }: { href: string }) {
  return (
    <section id="pricing" className="bg-cream2 px-6 py-18">
      <div className="max-w-[800px] mx-auto text-center">
        <p className="text-[11px] uppercase tracking-wider text-brand font-semibold mb-3">Pricing</p>
        <h2 className="font-display text-3xl sm:text-4xl text-ink mb-10">Start free. Upgrade if you love it.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <PricingCard name="Free Brew" price="$0" desc="Everything you need to start studying alongside strangers today." features={[["✓", "Main Café & Library rooms"], ["✓", "Pomodoro timer"], ["✓", "Murmurs stream"]]} cta="Get started free" href={href} />
          <PricingCard name="Brew+" price="$4.99" featured desc="For later, after traction and a real billing provider." features={[["✓", "Everything in Free"], ["✓", "Region-aware plans"]]} cta="Not available yet" href={href} />
          <PricingCard name="Brew Pro" price="$9.99" desc="Reserved for a future paid launch." features={[["✓", "Everything in Brew+"]]} cta="Not available yet" href={href} />
        </div>
      </div>
    </section>
  );
}

function PricingCard({
  name,
  price,
  desc,
  features,
  cta,
  href,
  featured,
}: {
  name: string;
  price: string;
  desc: string;
  features: [string, string][];
  cta: string;
  href: string;
  featured?: boolean;
}) {
  return (
    <div className={`bg-parchment border rounded-2xl p-7 relative ${featured ? "border-brand shadow-[0_0_0_1px_var(--brand)]" : "border-border"}`}>
      {featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">Most popular</div>}
      <div className="text-[13px] font-semibold text-ink-soft uppercase tracking-wide mb-3">{name}</div>
      <div className="font-display text-4xl text-ink leading-none">
        {price}
        <sub className="font-sans text-[13px] text-ink-soft">/month</sub>
      </div>
      <div className="text-[13px] text-ink-soft my-3 leading-relaxed">{desc}</div>
      <div className="h-px bg-border my-3" />
      {features.map(([mark, text]) => (
        <div key={text} className="flex items-start gap-2 text-[13px] text-ink-mid mb-1.5">
          <span className={mark === "✓" ? "text-green flex-shrink-0" : "text-ink-muted flex-shrink-0"}>{mark}</span>
          {text}
        </div>
      ))}
      <Button href={href} variant={featured ? "primary" : "outline"} size="lg" className="w-full mt-5">
        {cta}
      </Button>
    </div>
  );
}
