import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "BrewTogether — Virtual Study Café",
    template: "%s — BrewTogether",
  },
  description:
    "Study alongside strangers, feel less alone, get more done. A virtual study café with live presence, Pomodoro timers, and ambient Murmurs. Free during launch.",
  openGraph: {
    title: "BrewTogether — Virtual Study Café",
    description: "The café where strangers study together.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
