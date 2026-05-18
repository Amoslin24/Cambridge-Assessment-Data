import type { KetPhoneSmsPrompt } from '@/lib/ketPromptTypes';

interface PhoneSmsPromptCardProps {
  prompt: KetPhoneSmsPrompt;
}

export function PhoneSmsPromptCard({ prompt }: PhoneSmsPromptCardProps): JSX.Element {
  return (
    <div className="mx-auto w-full max-w-[260px]" role="img" aria-label="手机短信界面">
      <div className="overflow-hidden rounded-[2rem] border-[3px] border-slate-800 bg-slate-900 shadow-xl">
        <PhoneHeader contactName={prompt.contactName} time={prompt.time} />
        <div className="min-h-[200px] bg-gradient-to-b from-slate-100 to-slate-200 px-3 py-4">
          <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-[14px] leading-snug text-slate-800 shadow-sm">
            <p className="whitespace-pre-line">{prompt.message}</p>
            {prompt.senderName ? (
              <p className="mt-2 text-right text-[13px] font-semibold text-slate-700">{prompt.senderName}</p>
            ) : null}
          </div>
        </div>
        <div className="h-8 bg-slate-900" />
      </div>
    </div>
  );
}

function PhoneHeader({ contactName, time }: { contactName: string; time?: string }): JSX.Element {
  return (
    <div className="border-b border-slate-700 bg-slate-800 px-4 py-2.5 text-center text-white">
      <p className="text-[11px] text-slate-400">{time ?? '08:21'}</p>
      <p className="text-sm font-semibold">{contactName}</p>
    </div>
  );
}
