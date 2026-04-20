'use client';

import type { JSX } from 'react';

export interface ImportLoadingBannerProps {
  loading: boolean;
  locale: 'zh' | 'en';
}

export function ImportLoadingBanner(props: ImportLoadingBannerProps): JSX.Element | null {
  if (!props.loading) {
    return null;
  }
  return (
    <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800 font-medium">
      {props.locale === 'zh' ? '正在解析文件，请稍候...' : 'Parsing file, please wait...'}
    </div>
  );
}
