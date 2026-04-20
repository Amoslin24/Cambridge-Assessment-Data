'use client';

import type { JSX } from 'react';

export interface ImportTemplateLinksProps {
  locale: 'zh' | 'en';
}

export function ImportTemplateLinks(props: ImportTemplateLinksProps): JSX.Element {
  const { locale } = props;
  return (
    <div className="mt-3 flex flex-wrap gap-3 text-sm">
      <a
        href="/templates/cambridge-import-template.csv"
        className="text-blue-700 font-medium hover:text-blue-900 underline underline-offset-2"
      >
        {locale === 'zh' ? '下载标准模板（CSV）' : 'Download standard template (CSV)'}
      </a>
      <a
        href="/templates/cambridge-import-template-zh.csv"
        className="text-blue-700 font-medium hover:text-blue-900 underline underline-offset-2"
      >
        {locale === 'zh' ? '下载中文模板（CSV）' : 'Download Chinese template (CSV)'}
      </a>
      <a
        href="/templates/cambridge-import-sample.csv"
        className="text-blue-700 font-medium hover:text-blue-900 underline underline-offset-2"
      >
        {locale === 'zh' ? '下载示例数据（CSV）' : 'Download sample data (CSV)'}
      </a>
      <a
        href="/templates/cambridge-import-guide.md"
        className="text-blue-700 font-medium hover:text-blue-900 underline underline-offset-2"
      >
        {locale === 'zh' ? '查看字段中英对照说明' : 'View field guide (ZH/EN)'}
      </a>
    </div>
  );
}
