import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Search,
  Activity
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200/80 mb-6 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              <span>Campus Resource Sharing Platform</span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold">Spring Boot + React</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.15]">
              Share Institutional Equipment & Spaces <span className="text-brand-600">With Confidence</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              ResourceBridge connects laboratories, university makerspaces, and research departments. 
              Discover high-value tools, reserve specialized spaces, and manage custodian handoffs within authorized campus boundaries.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Create Free Account
                </Button>
              </Link>
              <Link to="/discover" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto" leftIcon={<Search className="h-4 w-4" />}>
                  Browse Available Resources
                </Button>
              </Link>
            </div>

            {/* Micro assurances */}
            <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Session-based CSRF protection
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                PostgreSQL tenant isolation
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Append-only audit tracking
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Highlight / Mock Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-8 overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">Live Resource Discovery</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Cross-Department Campus Catalog</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Database Schema
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {/* Card 1 */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 hover:bg-white hover:border-brand-200 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  EQUIPMENT
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  Condition: NEW
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                Prusa i3 MK3S+ 3D Printer
              </h3>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                Located in MakerHub Room 204. High-resolution FDM printer with multi-filament support.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                <span>Max: 240 mins</span>
                <span className="font-medium text-brand-600">Requires Approval</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 hover:bg-white hover:border-brand-200 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                  SPACE
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  Condition: GOOD
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                Anechoic Audio Testing Suite
              </h3>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                Sound-dampened chamber for acoustic measurements and high-fidelity sensor calibration.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                <span>Max: 480 mins</span>
                <span className="font-medium text-emerald-600">Instant Access</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5 hover:bg-white hover:border-brand-200 transition-all duration-200 group">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  EQUIPMENT
                </span>
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                  Condition: FAIR
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                Keysight 4-Channel Oscilloscope
              </h3>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                Electronics Bench 3. Digital storage oscilloscope with 200 MHz bandwidth.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                <span>Max: 180 mins</span>
                <span className="font-medium text-brand-600">Requires Approval</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Engineered for Academic Trust & Security
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Unlike commercial booking tools, ResourceBridge enforces departmental verification and multi-role custody protocols.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-lg bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Institutional Scoping</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every resource and member belongs to a verified institution slug. Foreign keys are locked at the database tier to prevent cross-institution leaks.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Role Verification</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Granular role hierarchies: Admins, Resource Owners, Trainers, and Borrowers. Active membership requires supervisor verification timestamping.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Condition & Custody</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tracks equipment condition rating (NEW, GOOD, FAIR, POOR) and enforces maximum booking durations to eliminate hoarding.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Append-Only Audit</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              PostgreSQL trigger-enforced immutable audit trail. Actions cannot be updated or deleted, guaranteeing complete accountability.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-2xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Ready to bring ResourceBridge to your campus?
            </h2>
            <p className="text-sm text-brand-100 leading-relaxed">
              Register now with your university email address. Connect with existing campus departments or register your lab space.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-white text-brand-900 hover:bg-brand-50" rightIcon={<ArrowRight className="h-4 w-4 text-brand-900" />}>
                Create Account
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-brand-300 text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
