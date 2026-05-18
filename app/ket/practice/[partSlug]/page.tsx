import Link from 'next/link';
import { notFound } from 'next/navigation';
import { KetPrepHeader } from '@/components/ket/KetPrepHeader';
import { getKetDemoExercise, getKetPrepPart, slugToPartKey } from '@/lib/ketPrep';
import { listPublishedKetExercises } from '@/lib/ketPrepRepository';
interface KetPartListPageProps {
  params: Promise<{ partSlug: string }>;
}

export default async function KetPartListPage({ params }: KetPartListPageProps): Promise<JSX.Element> {
  const { partSlug } = await params;
  const partKey = slugToPartKey(partSlug);
  if (!partKey) {
    notFound();
  }

  const part = getKetPrepPart(partKey);
  if (!part) {
    notFound();
  }

  const exercises =
    partKey.startsWith('R_') ? await listPublishedKetExercises(partKey) : [];
  const demo = getKetDemoExercise(partKey);
  const backHref = '/ket';

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-6">
      <section className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <KetPrepHeader title={part.titleZh} subtitle={part.taskTypeZh} />

          <p className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-900">教研提示：</span>
            {part.teachingAdvice}
          </p>

          {exercises.length > 0 ? (
            <section className="mb-8">
              <h2 className="mb-3 text-lg font-bold text-slate-900">真题套卷（{exercises.length}）</h2>
              <ul className="space-y-3">
                {exercises.map((exercise) => (
                  <li key={exercise.id}>
                    <Link
                      href={`/ket/practice/${partSlug}/${exercise.id}`}
                      className="flex flex-col gap-1 rounded-2xl border border-slate-200 px-5 py-4 transition-colors hover:border-blue-300 hover:bg-blue-50/50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="font-semibold text-slate-900">{exercise.titleZh}</span>
                      <span className="text-sm text-slate-500">
                        {exercise.itemCount} 题
                        {exercise.sourceLabel ? ` · ${exercise.sourceLabel}` : ''}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="mb-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-600">
              尚无已发布真题。请按 <code className="text-xs">data/ket/{partSlug}/_template.json</code>{' '}
              从 PDF 录入 JSON 后放入同目录并刷新。
            </p>
          )}

          {demo && demo.items.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg font-bold text-slate-900">示范练习</h2>
              <Link
                href={`/ket/practice/${partSlug}/demo`}
                className="inline-flex rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-700 hover:text-blue-700"
              >
                进入示范（{demo.items.length} 题，非真题）
              </Link>
            </section>
          ) : null}

          <div className="mt-8">
            <Link href={backHref} className="text-sm text-slate-600 hover:text-blue-700">
              ← 返回 KET 目录
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
