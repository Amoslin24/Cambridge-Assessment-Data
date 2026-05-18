import type { KetSignPrompt } from '@/lib/ketPromptTypes';

interface SignPromptCardProps {
  prompt: KetSignPrompt;
}

export function SignPromptCard({ prompt }: SignPromptCardProps): JSX.Element {
  return (
    <div className="mx-auto w-full max-w-[300px]" role="img" aria-label="木栏告示牌">
      <div className="flex items-end justify-center gap-1 px-2 pb-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-3 rounded-t-sm bg-gradient-to-b from-amber-700 to-amber-900 shadow-sm"
            style={{ height: `${48 + (i % 3) * 8}px` }}
          />
        ))}
      </div>
      <div className="relative -mt-1 rounded border-2 border-slate-400 bg-white px-4 py-5 text-center shadow-md">
        <p className="text-lg font-black uppercase leading-tight tracking-wide text-slate-900">
          {prompt.headline}
        </p>
        {prompt.subline ? (
          <p className="mt-2 text-sm font-medium text-slate-700">{prompt.subline}</p>
        ) : null}
      </div>
    </div>
  );
}
