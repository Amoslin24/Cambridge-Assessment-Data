import Link from 'next/link';

interface KetPrepHeaderProps {
  title: string;
  subtitle?: string;
}

export function KetPrepHeader({ title, subtitle }: KetPrepHeaderProps): JSX.Element {
  return (
    <header className="mb-8">
      <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-600 no-print">
        <Link href="/" className="hover:text-blue-700 transition-colors">
          成绩导入
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/ket" className="hover:text-blue-700 transition-colors">
          KET 备考
        </Link>
        <span className="ml-auto inline-flex gap-2">
          <Link
            href="/analysis"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:border-blue-700 hover:text-blue-700 transition-colors"
          >
            数据分析
          </Link>
        </span>
      </nav>
      <h1 className="mt-4 text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
      {subtitle ? <p className="mt-3 text-slate-600 leading-relaxed max-w-3xl">{subtitle}</p> : null}
    </header>
  );
}
