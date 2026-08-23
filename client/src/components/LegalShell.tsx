import { Link } from "wouter";
import type { ReactNode } from "react";

// Shared chrome for /terms and /privacy. Keeps the shell and typography
// consistent between both legal pages so we're not duplicating markup.
export default function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
            Signaturely
          </Link>
          <Link href="/" className="text-sm text-teal-700 hover:underline">
            ← Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="text-xs uppercase tracking-widest text-slate-500">
          Legal
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {updated}</p>

        <article className="prose prose-slate mt-10 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h2:mt-10 prose-h2:text-xl prose-p:leading-relaxed prose-p:text-slate-700 prose-a:text-teal-700 prose-a:no-underline hover:prose-a:underline prose-li:text-slate-700">
          {children}
        </article>

        <div className="mt-16 border-t border-slate-200 pt-6 text-xs text-slate-500">
          Signaturely is a product of <b>Elapid Group Pty Ltd</b>, an Australian
          proprietary limited company. Brisbane, Australia.
        </div>
      </main>
    </div>
  );
}
