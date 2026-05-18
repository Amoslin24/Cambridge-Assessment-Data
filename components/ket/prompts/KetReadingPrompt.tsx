import { EmailPromptCard } from '@/components/ket/prompts/EmailPromptCard';
import { NotePromptCard } from '@/components/ket/prompts/NotePromptCard';
import { PhoneSmsPromptCard } from '@/components/ket/prompts/PhoneSmsPromptCard';
import { SignPromptCard } from '@/components/ket/prompts/SignPromptCard';
import type { KetReadingPrompt } from '@/lib/ketPromptTypes';
import { formatPromptLine } from '@/components/ket/prompts/formatPromptLine';

interface KetReadingPromptViewProps {
  prompt: KetReadingPrompt;
}

export function KetReadingPromptView({ prompt }: KetReadingPromptViewProps): JSX.Element {
  switch (prompt.variant) {
    case 'note':
      return (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100/40 to-orange-50/30 p-6">
          <NotePromptCard prompt={prompt} />
        </div>
      );
    case 'phone_sms':
      return (
        <div className="flex min-h-[260px] items-center justify-center rounded-2xl bg-slate-200/50 p-6">
          <PhoneSmsPromptCard prompt={prompt} />
        </div>
      );
    case 'sign':
      return (
        <div className="flex min-h-[240px] items-end justify-center rounded-2xl bg-gradient-to-b from-sky-100/50 to-green-50/40 p-6 pb-8">
          <SignPromptCard prompt={prompt} />
        </div>
      );
    case 'email':
      return (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl bg-slate-100/80 p-6">
          <EmailPromptCard prompt={prompt} />
        </div>
      );
    case 'plain':
    default:
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-[15px] leading-relaxed text-slate-800">
          <p className="whitespace-pre-line">{formatPromptLine(prompt.text)}</p>
        </div>
      );
  }
}
