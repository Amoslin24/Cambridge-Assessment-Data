import type { CambridgeExamRecord } from '@/lib/cambridgeEngine';
import type { PartThresholdPartition, SkillDetail, SkillStrength } from '@/lib/examSkillBreakdown';
import type { ProgressMetrics } from '@/lib/analysisPageUtils';

export interface AnalysisStudentProfileData {
  record: CambridgeExamRecord;
  details: SkillDetail[];
  weakSkills: Array<{
    skill: string;
    converted: number;
    rawTotal: number;
    maxTotal: number;
    strength: SkillStrength;
  }>;
  attentionSkills: Array<{
    skill: string;
    converted: number;
    rawTotal: number;
    maxTotal: number;
    strength: SkillStrength;
  }>;
  partThresholds: PartThresholdPartition;
  progress: ProgressMetrics | null;
  radarData: Array<{ skill: string; converted: number; fullMark: number }>;
  suggestion: string;
}
