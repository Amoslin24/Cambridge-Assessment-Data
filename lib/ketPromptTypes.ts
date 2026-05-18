/** KET 阅读 Part 1 题干视觉样式（对齐纸笔真题版式） */
export type KetPromptVariant = 'note' | 'phone_sms' | 'sign' | 'email' | 'plain';

export interface KetReadingPromptBase {
  variant: KetPromptVariant;
}

export interface KetNotePrompt extends KetReadingPromptBase {
  variant: 'note';
  /** 便签正文行；用 **文字** 表示加粗 */
  lines: string[];
}

export interface KetPhoneSmsPrompt extends KetReadingPromptBase {
  variant: 'phone_sms';
  contactName: string;
  time?: string;
  message: string;
  /** 短信署名，显示在气泡下方（可选） */
  senderName?: string;
}

export interface KetSignPrompt extends KetReadingPromptBase {
  variant: 'sign';
  headline: string;
  subline?: string;
}

export interface KetEmailPrompt extends KetReadingPromptBase {
  variant: 'email';
  to?: string;
  from: string;
  subject?: string;
  body: string;
}

export interface KetPlainPrompt extends KetReadingPromptBase {
  variant: 'plain';
  text: string;
}

export type KetReadingPrompt =
  | KetNotePrompt
  | KetPhoneSmsPrompt
  | KetSignPrompt
  | KetEmailPrompt
  | KetPlainPrompt;

export function isKetReadingPrompt(value: unknown): value is KetReadingPrompt {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const variant = (value as KetReadingPrompt).variant;
  return (
    variant === 'note' ||
    variant === 'phone_sms' ||
    variant === 'sign' ||
    variant === 'email' ||
    variant === 'plain'
  );
}
