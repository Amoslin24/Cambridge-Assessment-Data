import type { KetNotePrompt } from '@/lib/ketPromptTypes';
import { formatPromptLine } from '@/components/ket/prompts/formatPromptLine';

interface NotePromptCardProps {
  prompt: KetNotePrompt;
}

export function NotePromptCard({ prompt }: NotePromptCardProps): JSX.Element {
  return (
    <div className="relative mx-auto w-full max-w-[280px] pt-5">
      <div className="absolute left-1/2 top-1 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-red-500 shadow-[0_2px_4px_rgba(0,0,0,0.25)] ring-2 ring-red-600/40" aria-hidden />
      <div
        className="relative -rotate-1 rounded-sm border border-amber-200/90 bg-gradient-to-b from-[#fffef5] to-amber-50 px-5 py-7 shadow-[2px_4px_14px_rgba(0,0,0,0.14)]"
        role="img"
        aria-label="便签告示"
      >
        <div className="space-y-2 text-center text-[15px] leading-snug text-slate-800">
          {prompt.lines.map((line) => (
            <p key={line}>{formatPromptLine(line)}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
