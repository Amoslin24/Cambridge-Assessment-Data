import type { CambridgeExamRecord, ParseIssue } from '@/lib/cambridgeEngine';
import type { ImportAuditEntry, ImportMode, ReplacedRecordPreview } from '@/lib/importPageUtils';

export type ImportStep = 'prepare' | 'upload' | 'review' | 'result';

export interface PersistedDashboardState {
  fileName: string;
  records: CambridgeExamRecord[];
  issues: ParseIssue[];
  savedAt: string;
  auditLog?: ImportAuditEntry[];
}

export interface PendingImportPreview {
  mode: ImportMode;
  targetFileName: string;
  incomingRecords: CambridgeExamRecord[];
  incomingIssues: ParseIssue[];
  nextRecords: CambridgeExamRecord[];
  nextIssues: ParseIssue[];
  addedCount: number;
  replacedCount: number;
  existingRecordsCount: number;
  replacedPreviews: ReplacedRecordPreview[];
}

export interface ImportStats {
  mode: ImportMode;
  addedCount: number;
  replacedCount: number;
  issueCount: number;
  totalAfterImport: number;
}
