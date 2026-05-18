import { KetPartCard } from '@/components/ket/KetPartCard';
import { KetPrepHeader } from '@/components/ket/KetPrepHeader';
import { countPublishedKetExercises, getSupabasePracticeStatus } from '@/lib/ketPrepRepository';
import {
  getKetPrepPartsBySkill,
  getKetSkillLabel,
  KET_EXAM_OVERVIEW_ZH,
  type KetPrepSkill,
} from '@/lib/ketPrep';
import { KET_READING_R_P2_PART_KEY } from '@/lib/ketMatchingTypes';
import { KET_READING_R_P1_PART_KEY } from '@/lib/ketPracticeTypes';

const SKILL_ORDER: KetPrepSkill[] = ['reading', 'listening', 'writing'];

export default async function KetPrepPage(): Promise<JSX.Element> {
  const rP1PublishedCount = await countPublishedKetExercises(KET_READING_R_P1_PART_KEY);
  const rP2PublishedCount = await countPublishedKetExercises(KET_READING_R_P2_PART_KEY);
  const { configured: supabaseConfigured } = getSupabasePracticeStatus();

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-6">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <KetPrepHeader
            title={KET_EXAM_OVERVIEW_ZH.title}
            subtitle={`${KET_EXAM_OVERVIEW_ZH.cefr} · ${KET_EXAM_OVERVIEW_ZH.durationZh}`}
          />

          <p className="mb-6 max-w-3xl leading-relaxed text-slate-600">{KET_EXAM_OVERVIEW_ZH.papersZh}</p>

          <PdfImportGuide
            supabaseConfigured={supabaseConfigured}
            rP1PublishedCount={rP1PublishedCount}
            rP2PublishedCount={rP2PublishedCount}
          />

          <div className="mb-10 rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4 text-sm leading-relaxed text-amber-950">
            {KET_EXAM_OVERVIEW_ZH.yleNote}
          </div>

          <ul className="mb-10 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
            <li className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              Part 1 为短讯息三选一；Part 2 为三人匹配（Q7–Q13）
            </li>
            <li className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              PDF 需人工转录为 JSON（保证选项与答案一致）
            </li>
            <li className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              后期可对接分析面板按题段推荐练习
            </li>
          </ul>

          {SKILL_ORDER.map((skill) => {
            const parts = getKetPrepPartsBySkill(skill);
            return (
              <section key={skill} className="mb-12 last:mb-0">
                <h2 className="mb-4 text-xl font-bold text-slate-900">{getKetSkillLabel(skill)}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {parts.map((part) => (
                    <KetPartCard
                      key={part.partKey}
                      part={part}
                      publishedExerciseCount={
                        part.partKey === KET_READING_R_P1_PART_KEY
                          ? rP1PublishedCount
                          : part.partKey === KET_READING_R_P2_PART_KEY
                            ? rP2PublishedCount
                            : 0
                      }
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function PdfImportGuide({
  supabaseConfigured,
  rP1PublishedCount,
  rP2PublishedCount,
}: {
  supabaseConfigured: boolean;
  rP1PublishedCount: number;
  rP2PublishedCount: number;
}): JSX.Element {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-relaxed text-slate-700">
      <p className="font-semibold text-slate-900">真题 JSON 接入（PDF 需人工录入）</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Part 1：<code className="text-xs">data/ket/r-p1/*.json</code>（6 题 · 便签/手机/邮件样式）</li>
        <li>Part 2：<code className="text-xs">data/ket/r-p2/*.json</code>（7 道匹配 · 3 人短文）</li>
      </ul>
      {(rP1PublishedCount > 0 || rP2PublishedCount > 0) && (
        <p className="mt-3 text-emerald-800">
          已加载：Part 1 共 {rP1PublishedCount} 套；Part 2 共 {rP2PublishedCount} 套。
        </p>
      )}
      {rP1PublishedCount === 0 && rP2PublishedCount === 0 && !supabaseConfigured && (
        <p className="mt-3 text-amber-800">JSON 设 is_published: true 后刷新本页即可。</p>
      )}
    </div>
  );
}
