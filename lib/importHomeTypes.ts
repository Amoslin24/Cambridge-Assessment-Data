import type { CambridgeExamRecord, ParseIssue } from '@/lib/cambridgeEngine';
import type { ImportAuditEntry, ImportMode, MergeOutcome } from '@/lib/importPageUtils';

export interface PersistedDashboardState {
  fileName: string;
  records: CambridgeExamRecord[];
  issues: ParseIssue[];
  savedAt: string;
  auditLog?: ImportAuditEntry[];
}

export interface PendingAppendImport {
  targetFileName: string;
  mergedRecords: CambridgeExamRecord[];
  mergedIssues: ParseIssue[];
  outcome: MergeOutcome;
}

export interface ImportStats {
  mode: ImportMode;
  addedCount: number;
  replacedCount: number;
  issueCount: number;
  totalAfterImport: number;
}
