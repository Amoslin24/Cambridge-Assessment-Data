import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'KET 备考练习 | Valruna',
  description: 'Cambridge A2 Key (KET) 分 Part 备考练习，题段满分与成绩分析导入口径一致。',
};

export default function KetLayout({ children }: { children: ReactNode }): ReactNode {
  return children;
}
