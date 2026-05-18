import Link from 'next/link';
import { notFound } from 'next/navigation';
import { KetMatchingSession } from '@/components/ket/KetMatchingSession';
import { KetMcqSession } from '@/components/ket/KetMcqSession';
import { KetPrepHeader } from '@/components/ket/KetPrepHeader';
import { isKetMcqExerciseSet } from '@/lib/ketExerciseTypes';
import { getKetDemoExercise, getKetPrepPart, slugToPartKey } from '@/lib/ketPrep';
import { getKetExerciseSet } from '@/lib/ketPrepRepository';
import { isKetMatchingExerciseSet } from '@/lib/ketMatchingTypes';

interface KetExercisePlayPageProps {
  params: Promise<{ partSlug: string; exerciseId: string }>;
}

export default async function KetExercisePlayPage({ params }: KetExercisePlayPageProps): Promise<JSX.Element> {
  const { partSlug, exerciseId } = await params;
  const partKey = slugToPartKey(partSlug);
  if (!partKey) {
    notFound();
  }

  const part = getKetPrepPart(partKey);
  if (!part) {
    notFound();
  }

  const backHref = `/ket/practice/${partSlug}`;
  let exercise = null;

  if (exerciseId === 'demo') {
    exercise = getKetDemoExercise(partKey);
    if (!exercise) {
      notFound();
    }
  } else {
    exercise = await getKetExerciseSet(exerciseId, partKey);
    if (!exercise || exercise.partKey !== partKey) {
      notFound();
    }
  }

  const isMatching = isKetMatchingExerciseSet(exercise);
  const maxWidth = isMatching ? 'max-w-4xl' : 'max-w-3xl';

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-6">
      <section className={`mx-auto ${maxWidth}`}>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <KetPrepHeader title={exercise.titleZh} subtitle={part.taskTypeZh} />

          <p className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-900">说明：</span>
            {exercise.introZh}
          </p>

          {isMatching ? (
            <KetMatchingSession exercise={exercise} backHref={backHref} />
          ) : isKetMcqExerciseSet(exercise) ? (
            <KetMcqSession exercise={exercise} backHref={backHref} />
          ) : null}

          <div className="mt-8">
            <Link href={backHref} className="text-sm text-slate-600 hover:text-blue-700">
              ← 返回套卷列表
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
