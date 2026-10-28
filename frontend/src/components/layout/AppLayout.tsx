import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Shield, BookOpen, GitBranch } from 'lucide-react';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-1">
              <span className="font-bold text-slate-900 tracking-tight flex items-center gap-2">
                ResourceBridge
              </span>
              <p className="text-xs text-slate-500 leading-relaxed">
                Empowering university students, researchers, and faculty to share institutional laboratory equipment, makerspace machinery, and study facilities within trusted academic boundaries.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Platform
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  <Link to="/discover" className="hover:text-brand-600">Discover Equipment</Link>
                </li>
                <li>
                  <Link to="/institutions" className="hover:text-brand-600">Partner Campuses</Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-brand-600">Student Access</Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Security & Compliance
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Session & CSRF Protection</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-brand-600" />
                  <span>PostgreSQL Audit Triggers</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <GitBranch className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Tenant Isolation Enforced</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Hackathon Project
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-2">
                Built with Spring Boot 4, PostgreSQL, React, TypeScript, and Tailwind CSS.
              </p>
              <div className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <span>Designed for modern campuses</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
            <p>© {new Date().getFullYear()} ResourceBridge. All rights reserved.</p>
            <p className="mt-2 sm:mt-0 flex items-center gap-1">
              <span>Institution-grade resource sharing</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
