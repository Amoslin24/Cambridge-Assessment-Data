import assert from 'node:assert/strict';
import {
  convertRawScores,
  getPartRawMax,
  parseCambridgeSpreadsheet,
  type CambridgeLevel,
} from '../lib/cambridgeEngine.ts';

function expectMSE(
  level: Extract<CambridgeLevel, 'KET' | 'PET' | 'FCE'>,
  input: { readingRaw: number; writingRaw: number; listeningRaw: number; fceUseOfEnglishRaw?: number },
  expected: {
    readingScale: number;
    writingScale: number;
    listeningScale: number;
    useOfEnglishScale?: number;
    total: number;
  },
): void {
  const result = convertRawScores(
    level,
    input.readingRaw,
    input.writingRaw,
    input.listeningRaw,
    level === 'FCE' ? { fceUseOfEnglishRaw: input.fceUseOfEnglishRaw } : undefined,
  );
  assert.equal(result.mode, 'MSE_SCALE');
  if (result.mode !== 'MSE_SCALE') {
    throw new Error('MSE 结果类型错误');
  }
  assert.equal(result.readingScale, expected.readingScale, `${level} readingScale 校验失败`);
  assert.equal(result.writingScale, expected.writingScale, `${level} writingScale 校验失败`);
  assert.equal(result.listeningScale, expected.listeningScale, `${level} listeningScale 校验失败`);
  if (level === 'FCE') {
    assert.equal(
      result.useOfEnglishScale,
      expected.useOfEnglishScale,
      `${level} useOfEnglishScale 校验失败`,
    );
  }
  assert.equal(result.value, expected.total, `${level} total 校验失败`);
}

async function run(): Promise<void> {
  // 写作分项满分应按级别动态：KET 15/15，PET/FCE 20/20
  assert.equal(getPartRawMax('KET', 'W_P1'), 15);
  assert.equal(getPartRawMax('KET', 'W_P2'), 15);
  assert.equal(getPartRawMax('PET', 'W_P1'), 20);
  assert.equal(getPartRawMax('FCE', 'W_P2'), 20);
  assert.equal(getPartRawMax('PET', 'R_P1'), 5);
  assert.equal(getPartRawMax('KET', 'R_P1'), 6);
  assert.equal(getPartRawMax('Flyers', 'W_P1'), 0);

  // KET：写作 raw=30 应到 150（旧 bug 会因封顶 5+5 导致异常偏低）
  expectMSE(
    'KET',
    { readingRaw: 30, writingRaw: 30, listeningRaw: 25 },
    { readingScale: 150, writingScale: 150, listeningScale: 150, total: 150 },
  );

  // PET：写作 raw=40 应到 170
  expectMSE(
    'PET',
    { readingRaw: 32, writingRaw: 40, listeningRaw: 25 },
    { readingScale: 170, writingScale: 170, listeningScale: 170, total: 170 },
  );

  // FCE：写作 raw=40 应到 190
  expectMSE(
    'FCE',
    { readingRaw: 42, writingRaw: 40, listeningRaw: 30, fceUseOfEnglishRaw: 28 },
    {
      readingScale: 190,
      useOfEnglishScale: 190,
      writingScale: 190,
      listeningScale: 190,
      total: 190,
    },
  );

  // YLE：仍只看 R&W + L，写作 raw 输入不应影响结果
  const yle = convertRawScores('Movers', 33, 30, 21);
  assert.equal(yle.mode, 'YLE_SHIELDS');
  if (yle.mode !== 'YLE_SHIELDS') {
    throw new Error('YLE 结果类型错误');
  }
  assert.equal(yle.readingWritingShield, 5);
  assert.equal(yle.listeningShield, 5);
  assert.equal(yle.value, 10);

  // 导入边界值：R/L 按各级别官方 Part 满分封顶，写作按级别上限；并产生可读 issues
  const csv = [
    'Name,Class,Set,Level,ExamDate,R_P1,R_P2,R_P3,R_P4,R_P5,R_P6,R_P7,L_P1,L_P2,L_P3,L_P4,L_P5,W_P1,W_P2',
    '边界KET,ClassA,A,KET,2026-04-20,7,abc,5,0,4,0,0,-1,2,3,4,5,16,14',
    '边界PET,ClassB,B,PET,2026-04-20,5,5,5,5,5,5,0,5,5,5,5,5,20,21',
  ].join('\n');
  const file = new File([csv], 'boundary.csv', { type: 'text/csv' });
  const parsed = await parseCambridgeSpreadsheet(file);

  assert.equal(parsed.records.length, 2);
  const ket = parsed.records[0]!;
  const pet = parsed.records[1]!;

  // KET: R_P1=7 -> 6, R_P2=abc -> 0, L_P1=-1 -> 0, W_P1=16 -> 15
  assert.equal(ket.level, 'KET');
  assert.equal(ket.reading.R_P1, 6);
  assert.equal(ket.reading.R_P2, 0);
  assert.equal(ket.listening.L_P1, 0);
  assert.equal(ket.writing.W_P1, 15);
  assert.equal(ket.writing.W_P2, 14);

  // PET: W_P2=21 -> 20
  assert.equal(pet.level, 'PET');
  assert.equal(pet.writing.W_P1, 20);
  assert.equal(pet.writing.W_P2, 20);

  const issueText = parsed.issues.map((item) => item.message).join('\n');
  assert.ok(issueText.includes('R_P1 分值 7 超过当前级别上限 6'));
  assert.ok(issueText.includes('R_P2 分值“abc”不是有效数字'));
  assert.ok(issueText.includes('L_P1 分值 -1 低于 0'));
  assert.ok(issueText.includes('W_P1 分值 16 超过当前级别上限 15'));
  assert.ok(issueText.includes('W_P2 分值 21 超过当前级别上限 20'));

  console.log('cambridgeEngine tests passed');
}

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
