import Link from 'next/link';
import type { KetPrepPart } from '@/lib/ketPrep';
import { getKetSkillLabel, partKeyToSlug } from '@/lib/ketPrep';

interface KetPartCardProps {
  part: KetPrepPart;
  publishedExerciseCount?: number;
}

export function KetPartCard({ part, publishedExerciseCount = 0 }: KetPartCardProps): JSX.Element {
  const slug = partKeyToSlug(part.partKey);
  const hasPublished = publishedExerciseCount > 0;
  const hasDemo = part.availability === 'demo' && part.demoExerciseCount > 0;
  const badgeLabel = hasPublished ? '真题' : hasDemo ? '示范' : '待上线';
  const badgeClass = hasPublished
    ? 'bg-blue-100 text-blue-800'
    : hasDemo
      ? 'bg-emerald-100 text-emerald-800'
      : 'bg-amber-50 text-amber-800';

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-200 transition-colors">
      <PartCardTop part={part} badgeLabel={badgeLabel} badgeClass={badgeClass} />
      <p className="mt-2 text-sm font-medium text-slate-800">{part.taskTypeZh}</p>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-3">{part.teachingAdvice}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-slate-500">
          Part 满分 {part.maxScore} 分
          {hasPublished ? ` · 已上线 ${publishedExerciseCount} 套` : ''}
        </span>
        {hasPublished ? (
          <Link
            href={`/ket/practice/${slug}`}
            className="inline-flex justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            进入真题列表（{publishedExerciseCount} 套）
          </Link>
        ) : hasDemo ? (
          <Link
            href={`/ket/practice/${slug}/demo`}
            className="inline-flex justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            示范练习（{part.demoExerciseCount} 题）
          </Link>
        ) : (
          <span className="inline-flex justify-center rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500">
            题库筹备中
          </span>
        )}
      </div>
    </article>
  );
}

function PartCardTop({
  part,
  badgeLabel,
  badgeClass,
}: {
  part: KetPrepPart;
  badgeLabel: string;
  badgeClass: string;
}): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{getKetSkillLabel(part.skill)}</p>
        <h3 className="mt-1 text-lg font-bold text-slate-900">{part.titleZh}</h3>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>{badgeLabel}</span>
    </div>
  );
}
