import type { KetEmailPrompt } from '@/lib/ketPromptTypes';

interface EmailPromptCardProps {
  prompt: KetEmailPrompt;
}

export function EmailPromptCard({ prompt }: EmailPromptCardProps): JSX.Element {
  return (
    <div className="mx-auto w-full max-w-[320px]" role="img" aria-label="电子邮件界面">
      <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-lg">
        <EmailWindowBar />
        <div className="space-y-1 border-b border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700">
          {prompt.to ? (
            <p>
              <span className="font-semibold text-slate-500">To: </span>
              {prompt.to}
            </p>
          ) : null}
          <p>
            <span className="font-semibold text-slate-500">From: </span>
            {prompt.from}
          </p>
          {prompt.subject ? (
            <p>
              <span className="font-semibold text-slate-500">Subject: </span>
              {prompt.subject}
            </p>
          ) : null}
        </div>
        <div className="px-4 py-4 text-[14px] leading-relaxed text-slate-800">
          <p className="whitespace-pre-line">{prompt.body}</p>
        </div>
      </div>
    </div>
  );
}

function EmailWindowBar(): JSX.Element {
  return (
    <div className="flex items-center gap-1.5 border-b border-slate-300 bg-gradient-to-b from-slate-100 to-slate-200 px-3 py-2">
      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
    </div>
  );
}
