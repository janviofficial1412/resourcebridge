import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarCheck,
  Compass,
  Layers,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

const principles = [
  {
    icon: Building2,
    title: 'Grounded in your institution',
    description: 'Resources stay connected to the campus communities and memberships that make sharing possible.',
  },
  {
    icon: CalendarCheck,
    title: 'Clear from request to handoff',
    description: 'Availability, booking windows and owner decisions live together, so expectations are easy to follow.',
  },
  {
    icon: ShieldCheck,
    title: 'Shared with care',
    description: 'Institutional roles and approval preferences help owners share equipment and spaces responsibly.',
  },
];

export const LandingPage: React.FC = () => (
  <div className="overflow-hidden">
    <section className="relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_76%_22%,rgba(220,235,224,0.68),transparent_38%),linear-gradient(180deg,#faf9f6_0%,#f4f3ed_100%)]" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-28 lg:pt-24">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3.5 py-2 text-xs font-medium text-brand-800 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            A resource network for academic communities
          </div>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[4.25rem]">
            Good work starts with
            <span className="block text-brand-700">what we share.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Make campus equipment and spaces easier to find, reserve and care for. ResourceBridge brings people and underused resources together across trusted institutions.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Join your campus
              </Button>
            </Link>
            <Link to="/discover">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto" leftIcon={<Compass className="h-4 w-4" />}>
                Explore the network
              </Button>
            </Link>
          </div>
          <div className="mt-9 flex items-center gap-3 text-sm text-slate-500">
            <div className="flex -space-x-2" aria-hidden="true">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f7f6f1] bg-brand-100 text-brand-800"><UsersRound className="h-4 w-4" /></span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f7f6f1] bg-[#f3e5dc] text-[#98583f]"><Building2 className="h-4 w-4" /></span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f7f6f1] bg-[#e8ede7] text-brand-700"><Layers className="h-4 w-4" /></span>
            </div>
            <span>For the people who make discovery happen.</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
          <div className="absolute -right-7 -top-8 h-40 w-40 rounded-full border border-brand-200/80" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-[#ead9ce]/70 blur-2xl" />
          <div className="relative rounded-[2rem] border border-white/80 bg-white/75 p-4 shadow-[0_32px_80px_-40px_rgba(27,56,42,0.38)] backdrop-blur">
            <div className="rounded-[1.5rem] bg-brand-900 p-6 text-white sm:p-8">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-brand-100">
                  <span className="h-2 w-2 rounded-full bg-[#d49a7d]" />
                  A more connected campus
                </span>
                <ArrowUpRight className="h-5 w-5 text-brand-200" />
              </div>
              <div className="mt-12 max-w-sm">
                <p className="text-sm font-medium text-brand-200">From a shared resource</p>
                <h2 className="mt-3 text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
                  One useful connection can move research forward.
                </h2>
                <p className="mt-4 text-sm leading-6 text-brand-100/85">
                  Find the right equipment, meet its custodian and make a plan that works for everyone.
                </p>
              </div>
              <div className="mt-10 flex items-center justify-between border-t border-white/15 pt-5">
                <span className="text-xs text-brand-200">Discover · Request · Share</span>
                <ArrowDownRight className="h-5 w-5 text-[#d49a7d]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-1 pt-4">
              <div className="rounded-2xl bg-[#f4f3ed] p-4">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">For resource owners</span>
                <p className="mt-2 text-sm font-semibold text-slate-900">Share with clarity</p>
              </div>
              <div className="rounded-2xl bg-[#f3e8e1] p-4">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#8d604b]">For campus members</span>
                <p className="mt-2 text-sm font-semibold text-slate-900">Find what you need</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="grid gap-8 border-b border-[#e7e5df] pb-10 md:grid-cols-[0.8fr_1.2fr] md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">A better way to share</p>
          <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl">
            Make access feel as thoughtful as the work.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
          Equipment and specialist spaces often sit just beyond the next department. ResourceBridge helps academic communities make those connections visible and useful.
        </p>
      </div>
      <div className="grid gap-4 pt-8 md:grid-cols-3">
        {principles.map(({ icon: Icon, title, description }, index) => (
          <article key={title} className="group rounded-2xl border border-[#e7e5df] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5">
            <div className="flex items-center justify-between">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${index === 1 ? 'bg-[#f3e8e1] text-[#98583f]' : 'bg-brand-50 text-brand-700'}`}>
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <span className="text-xs font-medium text-slate-400">0{index + 1}</span>
            </div>
            <h3 className="mt-7 text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 pb-20 pt-4 sm:px-6 lg:px-8 lg:pb-24">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#eee8dc] px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border border-brand-900/10" />
        <div className="absolute -right-1 -top-8 h-44 w-44 rounded-full border border-brand-900/10" />
        <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Start with your community</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">There is more to discover together.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Create an account to find participating institutions and connect with resources shared by their members.</p>
          </div>
          <Link to="/register" className="shrink-0">
            <Button size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="h-4 w-4" />}>Get started</Button>
          </Link>
        </div>
      </div>
    </section>
  </div>
);
