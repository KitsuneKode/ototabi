"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { AnalogCard } from "@/components/ui/analog-card";
import { MechButton, MonoLabel, PanelTitle, StatusBadge } from "@/components/ui/retro-primitives";
import { useTRPC } from "@/trpc/client";

type ShowNotesEditorProps = {
  sessionId: string;
  showNotes: {
    id: string;
    summary: string;
    keywords: unknown;
    seoTitles: unknown;
  };
  onSaved?: () => void;
};

export function ShowNotesEditor({ sessionId, showNotes, onSaved }: ShowNotesEditorProps) {
  const trpc = useTRPC();
  const [summary, setSummary] = useState(showNotes.summary);
  const dirty = summary.trim() !== showNotes.summary.trim();

  useEffect(() => {
    setSummary(showNotes.summary);
  }, [showNotes.summary]);

  const save = useMutation(
    trpc.sessionReview.updateShowNotes.mutationOptions({
      onSuccess: () => onSaved?.(),
    }),
  );

  const seoTitles = Array.isArray(showNotes.seoTitles) ? (showNotes.seoTitles as string[]) : [];

  return (
    <AnalogCard className="space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PanelTitle label="AI producer" title="Show notes" />
        {dirty ? (
          <StatusBadge variant="warn" className="text-[10px]">
            Unsaved edits
          </StatusBadge>
        ) : null}
      </div>
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={6}
        className="border-border bg-popover text-foreground focus:ring-accent/40 w-full resize-y rounded border p-3 font-mono text-sm leading-relaxed focus:ring-2 focus:outline-none"
        aria-label="Show notes summary"
      />
      <div className="flex flex-wrap gap-2">
        <MechButton
          type="button"
          disabled={!dirty || save.isPending || summary.trim().length === 0}
          onClick={() => save.mutate({ sessionId, summary: summary.trim() })}
        >
          {save.isPending ? "Saving…" : "Save summary"}
        </MechButton>
        {dirty ? (
          <MechButton type="button" onClick={() => setSummary(showNotes.summary)}>
            Discard
          </MechButton>
        ) : null}
      </div>
      {Array.isArray(showNotes.keywords) && (showNotes.keywords as string[]).length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {(showNotes.keywords as string[]).map((kw) => (
            <StatusBadge key={kw} variant="default" className="text-[10px]">
              {kw}
            </StatusBadge>
          ))}
        </div>
      ) : null}
      {seoTitles.length > 0 ? (
        <div className="space-y-2">
          <MonoLabel>SEO title ideas</MonoLabel>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 font-mono text-xs">
            {seoTitles.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {save.error ? (
        <p className="text-led-on font-mono text-[10px]">{save.error.message}</p>
      ) : null}
    </AnalogCard>
  );
}
