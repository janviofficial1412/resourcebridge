import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarCheck,
  Clock,
  ClipboardList,
  Compass,
  Package,
  Plus,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { SummaryCard } from '../components/ui/SummaryCard';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Loader } from '../components/ui/Loader';
import { institutionService } from '../features/institutions/institutionService';
import { InstitutionSummary } from '../features/institutions/institutionTypes';
import { dashboardService, DashboardData } from '../features/dashboard/dashboardService';
import { bookingService } from '../features/bookings/bookingService';
import { BookingResponse } from '../features/bookings/bookingTypes';
import { incidentService, IncidentReport } from '../features/incidents/incidentService';
import { ApiClientError } from '../services/api';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export const DashboardPage: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<InstitutionSummary[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshRevision, setRefreshRevision] = useState(0);

  const activeMemberships = useMemo(
    () => memberships.filter((membership) => membership.membershipStatus === 'ACTIVE'),
    [memberships]
  );
  const selectedMembership = activeMemberships.find((membership) => membership.id === selectedInstitutionId);
  const isAdmin = dashboard?.role === 'ADMIN';

  const loadMemberships = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = await institutionService.listMyMemberships();
      setMemberships(loaded);
      const active = loaded.filter((membership) => membership.membershipStatus === 'ACTIVE');
      setSelectedInstitutionId((current) =>
        active.some((membership) => membership.id === current) ? current : active[0]?.id ?? ''
      );
      setRefreshRevision((revision) => revision + 1);
    } catch (reason: unknown) {
      setError(reason instanceof ApiClientError
        ? reason.message
        : 'Unable to load your institution memberships.');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMemberships();
  }, [loadMemberships]);

  useEffect(() => {
    if (!selectedInstitutionId) {
      setDashboard(null);
      setActivity([]);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    setError(null);
    const loadInstitutionDashboard = async () => {
      try {
        const [metrics, membershipData] = await Promise.all([
          dashboardService.get(selectedInstitutionId),
          institutionService.listMyMemberships(),
        ]);
        if (!active) return;
        setDashboard(metrics);
        const role = membershipData.find((membership) => membership.id === selectedInstitutionId)?.role;
        let bookings: BookingResponse[];
        let reports: IncidentReport[];
        if (role === 'ADMIN') {
          [bookings, reports] = await Promise.all([
            bookingService.getIncomingBookings(undefined, selectedInstitutionId),
            incidentService.listInstitutionReports(selectedInstitutionId),
          ]);
        } else {
          const [allBookings, allReports] = await Promise.all([
            bookingService.getMyBookings(),
            incidentService.listMyReports(),
          ]);
          bookings = allBookings.filter((booking) => booking.institutionId === selectedInstitutionId);
          reports = allReports.filter((report) => report.institutionId === selectedInstitutionId);
        }
        if (!active) return;
        const bookingActivity = bookings.map((booking) => ({
          id: `booking-${booking.id}`,
          title: role === 'ADMIN' ? 'Booking request received' : 'Booking request submitted',
          description: `${booking.resourceName} · ${booking.requesterName}`,
          createdAt: booking.createdAt,
        }));
        const reportActivity = reports.map((report) => ({
          id: `incident-${report.id}`,
          title: 'Incident report submitted',
          description: role === 'ADMIN'
            ? `${report.reporterName} · ${report.institutionName}`
            : report.institutionName,
          createdAt: report.createdAt,
        }));
        setActivity([...bookingActivity, ...reportActivity]
          .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
          .slice(0, 5));
      } catch (reason: unknown) {
        if (active) {
          setError(reason instanceof ApiClientError
            ? reason.message
            : 'Unable to load dashboard information.');
          setDashboard(null);
          setActivity([]);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadInstitutionDashboard();
    return () => {
      active = false;
    };
  }, [selectedInstitutionId, refreshRevision]);

  if (isLoading && memberships.length === 0) {
    return <div className="flex justify-center py-20"><Loader size="lg" label="Loading your workspace..." /></div>;
  }

  if (error && !dashboard) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <ErrorState title="Unable to load your workspace" message={error} onRetry={loadMemberships} />
      </div>
    );
  }

  if (memberships.length === 0 || activeMemberships.length === 0) {
    const pending = memberships.some((membership) => membership.membershipStatus === 'PENDING');
    const registrationIntent = (location.state as { registrationIntent?: string } | null)?.registrationIntent;
    const studentOnboarding = registrationIntent === 'STUDENT';
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <EmptyState
          icon={<Building2 className="h-7 w-7 text-brand-600" />}
          title={pending
            ? 'Your membership request is awaiting approval'
            : studentOnboarding ? 'Find your institution' : 'Choose your institution'}
          badgeText={pending ? 'Membership pending' : 'No active memberships'}
          description={pending
            ? 'An institution administrator will review your request. You can explore other institutions while you wait.'
            : studentOnboarding
              ? 'Browse the institution directory and request student membership. Once approved, you can discover, match, book, and report resources.'
              : 'Create an institution or request to join an existing one to access resources and bookings.'}
          actionLabel={studentOnboarding ? 'Browse Institutions' : 'Explore Institutions'}
          actionHref="/institutions"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-[#e7e5df] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
            {isAdmin ? 'Institution administrator workspace' : 'Student workspace'}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back, {user?.fullName || user?.username || 'there'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {dashboard?.institutionName || selectedMembership?.name || 'Your institution'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="dashboard-institution" className="sr-only">Select institution workspace</label>
          <select
            id="dashboard-institution"
            value={selectedInstitutionId}
            onChange={(event) => setSelectedInstitutionId(event.target.value)}
            className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800"
          >
            {activeMemberships.map((membership) => (
              <option key={membership.id} value={membership.id}>
                {membership.name} · {membership.role === 'ADMIN' ? 'Administrator' : 'Student'}
              </option>
            ))}
          </select>
          <Button type="button" variant="secondary" size="sm" onClick={() => void loadMemberships()}
            leftIcon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader size="lg" label="Loading institution metrics..." /></div>
      ) : dashboard && (
        <>
          <section aria-label="Workspace metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isAdmin ? (
              <>
                <SummaryCard title="Total resources" value={dashboard.totalResources} status="active"
                  badgeText="Institution catalog" icon={<Package className="h-4 w-4 text-brand-700" />}
                  description="Resources registered across this institution." />
                <SummaryCard title="Available resources" value={dashboard.availableResources} status="active"
                  badgeText="Available" icon={<Compass className="h-4 w-4 text-brand-700" />}
                  description="Resources currently marked available." />
                <SummaryCard title="Pending booking requests" value={dashboard.pendingBookingRequests} status="pending"
                  badgeText="Needs review" icon={<CalendarCheck className="h-4 w-4 text-brand-700" />}
                  description="Student requests awaiting an administrator decision." />
                <SummaryCard title="Active students" value={dashboard.activeStudents} status="active"
                  badgeText="Active members" icon={<Users className="h-4 w-4 text-brand-700" />}
                  description="Students with active institution memberships." />
                <SummaryCard title="Open incident reports" value={dashboard.pendingIncidents} status="pending"
                  badgeText="Open or in progress" icon={<AlertCircle className="h-4 w-4 text-brand-700" />}
                  description="Reports that still need administrative attention." />
              </>
            ) : (
              <>
                <SummaryCard title="Eligible available resources" value={dashboard.availableResources} status="active"
                  badgeText="In this institution" icon={<Package className="h-4 w-4 text-brand-700" />}
                  description="Available resources excluding resources you own." />
                <SummaryCard title="My bookings" value={dashboard.myBookings} status="active"
                  badgeText="All statuses" icon={<CalendarCheck className="h-4 w-4 text-brand-700" />}
                  description="Your booking requests and reservations." />
                <SummaryCard title="Pending booking requests" value={dashboard.myPendingBookings} status="pending"
                  badgeText="Awaiting review" icon={<RefreshCw className="h-4 w-4 text-brand-700" />}
                  description="Requests that have not yet been decided." />
                <SummaryCard title="My incident reports" value={dashboard.myIncidents} status="active"
                  badgeText="Submitted" icon={<ClipboardList className="h-4 w-4 text-brand-700" />}
                  description="Reports you have submitted to this institution." />
              </>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-[#e7e5df] bg-white p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">Recent activity</h2>
                  <p className="mt-1 text-xs text-slate-500">Latest booking requests and incident reports.</p>
                </div>
                <Clock className="h-4 w-4 text-slate-400" aria-hidden />
              </div>
              {activity.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                  No recent booking or incident activity.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {activity.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                      </div>
                      <time className="shrink-0 text-xs text-slate-400" dateTime={item.createdAt}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-[#e7e5df] bg-white p-6">
              <h2 className="font-semibold text-slate-900">Quick actions</h2>
              <div className="mt-4 grid gap-3">
                {isAdmin ? (
                  <>
                    <ActionLink to="/my-resources" icon={<Plus className="h-4 w-4" />} title="Manage resources"
                      detail="Add, update, or retire institutional resources." />
                    <ActionLink to="/bookings/incoming" icon={<CalendarCheck className="h-4 w-4" />} title="Review booking requests"
                      detail="Approve or reject student requests." />
                    <ActionLink to="/institutions" icon={<Users className="h-4 w-4" />} title="Manage members"
                      detail="Review membership requests and active students." />
                  </>
                ) : (
                  <>
                    <ActionLink to="/discover" icon={<Compass className="h-4 w-4" />} title="Discover resources"
                      detail="Search available equipment and spaces." />
                    <ActionLink to="/bookings" icon={<CalendarCheck className="h-4 w-4" />} title="My bookings"
                      detail="Review your booking requests and history." />
                    <ActionLink to={`/institutions/${selectedInstitutionId}`} icon={<ClipboardList className="h-4 w-4" />}
                      title="Report an incident" detail="Submit a report and track its status." />
                  </>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

const ActionLink: React.FC<{ to: string; icon: React.ReactNode; title: string; detail: string }> = ({
  to, icon, title, detail,
}) => (
  <Link to={to} className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/40">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">{icon}</span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-medium text-slate-800 group-hover:text-brand-800">{title}</span>
      <span className="mt-0.5 block text-xs text-slate-500">{detail}</span>
    </span>
    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-brand-700" />
  </Link>
);
