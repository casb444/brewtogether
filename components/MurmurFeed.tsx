"use client";

import { useEffect, useRef, useState } from "react";
import type { Murmur } from "@/types/database";
import { murmurAuthorTag } from "@/lib/murmurs/guest-tag";

interface MurmurFeedProps {
  murmurs: Murmur[];
  onSend: (text: string) => void;
  canPost: boolean;
}

export function MurmurFeed({ murmurs, onSend, canPost }: MurmurFeedProps) {
  const [draft, setDraft] = useState("");
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [murmurs]);

  function handleSend() {
    if (!draft.trim()) return;
    onSend(draft);
    setDraft("");
  }

  return (
    <div className="border-t border-border px-5 py-3.5 flex-shrink-0">
      <div className="text-[11px] uppercase tracking-wider text-ink-muted mb-2.5">Murmurs</div>
      <div ref={feedRef} className="flex flex-col gap-1.5 max-h-32 overflow-y-auto mb-2.5">
        {murmurs.length === 0 && (
          <div className="text-[12px] text-ink-muted italic font-display">
            It&apos;s quiet in here. Be the first to say something.
          </div>
        )}
        {murmurs.map((m) => {
          const tag = murmurAuthorTag(Boolean(m.is_guest));
          return (
            <div key={m.id} className="animate-fade-up">
              <div className="text-[10px] font-semibold text-ink-soft">
                {m.display_name}
                {tag && (
                  <span className="ml-1 text-[9px] uppercase tracking-wide text-ink-muted font-semibold">
                    {tag}
                  </span>
                )}
              </div>
              <div className="font-display text-xs italic text-ink-mid leading-relaxed mt-px">
                &ldquo;{m.text}&rdquo;
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          maxLength={90}
          disabled={!canPost}
          placeholder={canPost ? "say something quiet…" : "sign in to post a murmur"}
          className="flex-1 px-2.5 py-1.5 rounded-lg border border-border bg-cream text-xs text-ink outline-none focus:border-brand focus:bg-white transition-colors placeholder:text-ink-muted disabled:opacity-60"
        />
        <button
          onClick={handleSend}
          disabled={!canPost}
          className="px-3 rounded-lg bg-brand text-white text-sm hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send murmur"
        >
          →
        </button>
      </div>
    </div>
  );
}
