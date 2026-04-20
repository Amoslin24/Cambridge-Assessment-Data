import type { ParseIssue } from '@/lib/cambridgeEngine';

export type IssueFilterKey =
  | 'ALL'
  | 'OVER_LIMIT_R'
  | 'OVER_LIMIT_L'
  | 'OVER_LIMIT_W'
  | 'NON_NUMERIC'
  | 'NEGATIVE';

export type IssueKind = 'OVER_LIMIT' | 'NON_NUMERIC' | 'NEGATIVE' | 'OTHER';
export type IssuePart = 'R' | 'L' | 'W' | 'N/A';

export interface IssueSummary {
  overLimitReadingCount: number;
  overLimitListeningCount: number;
  overLimitWritingCount: number;
  nonNumericCount: number;
  negativeCount: number;
  affectedRowCount: number;
}

export function getIssueFilterLabel(filter: IssueFilterKey): string {
  if (filter === 'OVER_LIMIT_R') {
    return '阅读超上限';
  }
  if (filter === 'OVER_LIMIT_L') {
    return '听力超上限';
  }
  if (filter === 'OVER_LIMIT_W') {
    return '写作超上限';
  }
  if (filter === 'NON_NUMERIC') {
    return '非数字分值';
  }
  if (filter === 'NEGATIVE') {
    return '负数分值';
  }
  return '全部异常';
}

export function classifyIssuePart(issue: ParseIssue): IssuePart {
  const partMatch = issue.message.match(/\b([RLW])_P\d+\b/);
  if (!partMatch?.[1]) {
    return 'N/A';
  }
  const part = partMatch[1];
  if (part === 'R' || part === 'L' || part === 'W') {
    return part;
  }
  return 'N/A';
}

export function classifyIssueKind(issue: ParseIssue): IssueKind {
  if (issue.message.includes('超过当前级别上限')) {
    return 'OVER_LIMIT';
  }
  if (issue.message.includes('不是有效数字')) {
    return 'NON_NUMERIC';
  }
  if (issue.message.includes('低于 0')) {
    return 'NEGATIVE';
  }
  return 'OTHER';
}

export function getIssueKindLabel(kind: IssueKind): string {
  if (kind === 'OVER_LIMIT') {
    return '超上限';
  }
  if (kind === 'NON_NUMERIC') {
    return '非数字分值';
  }
  if (kind === 'NEGATIVE') {
    return '负数分值';
  }
  return '其他';
}

export function matchesIssueFilter(issue: ParseIssue, filter: IssueFilterKey): boolean {
  const kind = classifyIssueKind(issue);
  const part = classifyIssuePart(issue);
  if (filter === 'OVER_LIMIT_R') {
    return kind === 'OVER_LIMIT' && part === 'R';
  }
  if (filter === 'OVER_LIMIT_L') {
    return kind === 'OVER_LIMIT' && part === 'L';
  }
  if (filter === 'OVER_LIMIT_W') {
    return kind === 'OVER_LIMIT' && part === 'W';
  }
  if (filter === 'NON_NUMERIC') {
    return kind === 'NON_NUMERIC';
  }
  if (filter === 'NEGATIVE') {
    return kind === 'NEGATIVE';
  }
  return true;
}

export function buildIssueSummary(issues: ParseIssue[]): IssueSummary {
  let overLimitReadingCount = 0;
  let overLimitListeningCount = 0;
  let overLimitWritingCount = 0;
  let nonNumericCount = 0;
  let negativeCount = 0;
  const affectedRows = new Set<number>();

  issues.forEach((issue) => {
    const kind = classifyIssueKind(issue);
    const part = classifyIssuePart(issue);
    if (kind === 'OVER_LIMIT' && part === 'R') {
      overLimitReadingCount += 1;
      affectedRows.add(issue.rowNumber);
    } else if (kind === 'OVER_LIMIT' && part === 'L') {
      overLimitListeningCount += 1;
      affectedRows.add(issue.rowNumber);
    } else if (kind === 'OVER_LIMIT' && part === 'W') {
      overLimitWritingCount += 1;
      affectedRows.add(issue.rowNumber);
    } else if (kind === 'NON_NUMERIC') {
      nonNumericCount += 1;
      affectedRows.add(issue.rowNumber);
    } else if (kind === 'NEGATIVE') {
      negativeCount += 1;
      affectedRows.add(issue.rowNumber);
    }
  });

  return {
    overLimitReadingCount,
    overLimitListeningCount,
    overLimitWritingCount,
    nonNumericCount,
    negativeCount,
    affectedRowCount: affectedRows.size,
  };
}
