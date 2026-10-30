import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Layers, ArrowUpRight, ShieldCheck } from 'lucide-react';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6] text-slate-800">
      <Navbar />

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="mt-20 border-t border-[#e7e5df] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
            <div className="space-y-4 md:col-span-2">
              <Link to="/" className="inline-flex items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-500">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-white"><Layers className="h-5 w-5" /></span>
                <span className="font-semibold tracking-tight text-slate-900">ResourceBridge</span>
              </Link>
              <p className="max-w-md text-sm leading-6 text-slate-600">
                Make more of the tools, spaces and expertise already present across your academic community.
              </p>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Explore</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li>
                  <Link to="/discover" className="inline-flex items-center gap-1 hover:text-brand-700">Discover resources <ArrowUpRight className="h-3.5 w-3.5" /></Link>
                </li>
                <li>
                  <Link to="/institutions" className="hover:text-brand-700">Institutions</Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-brand-700">Create an account</Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Built on trust</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-brand-600" />
                  <span>Institution-scoped access</span>
                </li>
                <li>Thoughtful, accountable sharing</li>
                <li>Resources across your institutions</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row">
            <p>© {new Date().getFullYear()} ResourceBridge. All rights reserved.</p>
            <p>Shared resources. Stronger academic communities.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
