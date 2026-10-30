import React, { useCallback, useEffect, useState } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ApiClientError } from '../../services/api';
import { IncidentReport, IncidentSummary, incidentService } from './incidentService';
import type { MembershipRole } from '../../types';

interface IncidentReportsPanelProps {
  institutionId: string;
  role: MembershipRole;
}

const SUMMARY_FIELDS: Array<{ key: keyof IncidentSummary; label: string }> = [
  { key: 'incidentSummary', label: 'Incident Summary' },
  { key: 'reportedIssue', label: 'Reported Issue' },
  { key: 'reportedDelay', label: 'Reported Delay' },
  { key: 'evidenceMentioned', label: 'Evidence Mentioned' },
  { key: 'suggestedNextAction', label: 'Suggested Next Action' },
  { key: 'missingInformation', label: 'Missing Information' },
];

export const IncidentReportsPanel: React.FC<IncidentReportsPanelProps> = ({ institutionId, role }) => {
  const [reportText, setReportText] = useState('');
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [status, setStatus] = useState<IncidentReport['status']>('OPEN');
  const [resolution, setResolution] = useState('');
  const [incidentIdInput, setIncidentIdInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDecision, setIsSavingDecision] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showError = (reason: unknown, fallback: string) => {
    setError(reason instanceof ApiClientError
      ? reason.isAuthError
        ? 'Your session has expired. Sign in again to continue.'
        : reason.message
      : fallback);
  };

  const refreshReports = useCallback(async () => {
    setIsLoadingReports(true);
    try {
      const loaded = role === 'ADMIN'
        ? await incidentService.listInstitutionReports(institutionId)
        : await incidentService.listMyReports();
      const scoped = loaded.filter((item) => item.institutionId === institutionId);
      setReports(scoped);
      setReport((current) => current
        ? scoped.find((item) => item.id === current.id) ?? current
        : null);
    } catch (reason) {
      showError(reason, 'Unable to load incident reports.');
    } finally {
      setIsLoadingReports(false);
    }
  }, [institutionId, role]);

  useEffect(() => {
    void refreshReports();
  }, [refreshReports]);

  const createReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reportText.trim() || isSaving) return;
    setIsSaving(true);
    setError(null);
    setSummary(null);
    try {
      setReport(await incidentService.create(institutionId, reportText));
      setReportText('');
      await refreshReports();
    } catch (reason) {
      showError(reason, 'Unable to save the incident report. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const loadReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!incidentIdInput.trim() || isLoadingReport) return;
    setIsLoadingReport(true);
    setError(null);
    setSummary(null);
    try {
      const loaded = await incidentService.get(incidentIdInput.trim());
      if (loaded.institutionId !== institutionId) {
        setError('That incident report belongs to a different institution.');
        return;
      }
      setReport(loaded);
      setStatus(loaded.status);
      setResolution(loaded.resolution ?? '');
    } catch (reason) {
      showError(reason, 'Unable to load this incident report.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  const selectReport = (selected: IncidentReport) => {
    setReport(selected);
    setStatus(selected.status);
    setResolution(selected.resolution ?? '');
    setSummary(null);
    setError(null);
  };

  const saveReportUpdate = async () => {
    if (!report || role !== 'ADMIN' || isSavingDecision) return;
    setIsSavingDecision(true);
    setError(null);
    try {
      const updated = await incidentService.update(report.id, status, resolution);
      setReport(updated);
      await refreshReports();
    } catch (reason) {
      showError(reason, 'Unable to update the incident report.');
    } finally {
      setIsSavingDecision(false);
    }
  };

  const generateSummary = async () => {
    if (!report || isSummarizing) return;
    setIsSummarizing(true);
    setError(null);
    setSummary(null);
    try {
      setSummary(await incidentService.summarize(report.id));
    } catch (reason) {
      showError(reason, 'Unable to prepare the summary. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <header className="flex items-start gap-3 border-b border-slate-100 pb-4">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
        <div>
          <h2 className="text-lg font-bold text-slate-900">Incident reports</h2>
          <p className="mt-1 text-xs text-slate-600">
            Submit a report and track its progress. Institution administrators can review and resolve reports.
          </p>
        </div>
      </header>

      <form onSubmit={createReport} className="space-y-3">
        <label htmlFor="incident-report-text" className="block text-sm font-semibold text-slate-800">
          New incident report
        </label>
        <textarea
          id="incident-report-text"
          value={reportText}
          onChange={(event) => setReportText(event.target.value)}
          maxLength={10000}
          rows={4}
          required
          placeholder="Describe what was reported. Include only details you know."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <Button type="submit" size="sm" isLoading={isSaving} disabled={!reportText.trim()}>
          Submit report
        </Button>
      </form>

      <div id={role === 'ADMIN' ? undefined : 'my-reports'} className="space-y-3 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">
            {role === 'ADMIN' ? 'Institution reports' : 'My reports'}
          </h3>
          <Button type="button" size="sm" variant="secondary" onClick={() => void refreshReports()}
            isLoading={isLoadingReports}>
            Refresh
          </Button>
        </div>
        {isLoadingReports ? (
          <p className="text-sm text-slate-500">Loading reports…</p>
        ) : reports.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
            No incident reports yet.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {reports.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => selectReport(item)}
                className={`rounded-lg border p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  report?.id === item.id
                    ? 'border-brand-300 bg-brand-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <span className="block text-xs font-semibold text-slate-800">
                  {role === 'ADMIN' ? item.reporterName : item.institutionName}
                </span>
                <span className="mt-1 line-clamp-2 block text-xs text-slate-600">{item.reportText}</span>
                <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                  {item.status.replace('_', ' ')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={loadReport} className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
        <label htmlFor="incident-id" className="sr-only">Incident report ID</label>
        <input
          id="incident-id"
          value={incidentIdInput}
          onChange={(event) => setIncidentIdInput(event.target.value)}
          placeholder="Open an incident by ID"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <Button type="submit" variant="secondary" size="sm" isLoading={isLoadingReport}
          disabled={!incidentIdInput.trim()}>
          Open report
        </Button>
      </form>

      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}

      {report && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900">Incident report</h3>
              <p className="break-all text-[11px] text-slate-500">
                {report.reporterName} · {new Date(report.createdAt).toLocaleDateString()} · {report.status.replace('_', ' ')}
              </p>
            </div>
            <Button type="button" size="sm" onClick={generateSummary} isLoading={isSummarizing}
              leftIcon={<Sparkles className="h-4 w-4" aria-hidden />}>
              {isSummarizing ? 'Generating summary…' : 'Generate AI Summary'}
            </Button>
          </div>
          <blockquote className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
            {report.reportText}
          </blockquote>
          {role === 'ADMIN' && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
              <label className="block text-xs font-semibold text-slate-700" htmlFor="incident-status">
                Report status
                <select
                  id="incident-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as IncidentReport['status'])}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-700" htmlFor="incident-resolution">
                Administrative resolution or notes
                <textarea
                  id="incident-resolution"
                  value={resolution}
                  onChange={(event) => setResolution(event.target.value)}
                  maxLength={10000}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
                  placeholder="Record the action taken or next steps."
                />
              </label>
              <Button type="button" size="sm" onClick={() => void saveReportUpdate()}
                isLoading={isSavingDecision}>
                Save report update
              </Button>
            </div>
          )}
          {report.resolution && role === 'MEMBER' && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <h4 className="text-xs font-semibold text-emerald-900">Administrative resolution</h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-emerald-900">{report.resolution}</p>
            </div>
          )}
        </div>
      )}

      {summary && (
        <section aria-label="AI-generated incident summary" className="space-y-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div>
            <h3 className="font-semibold text-amber-950">{summary.label}</h3>
            <p className="mt-1 text-xs text-amber-900">
              This draft does not verify claims or make administrative decisions. The original report is unchanged.
            </p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            {SUMMARY_FIELDS.map(({ key, label }) => (
              <div key={key} className="rounded-lg border border-amber-200 bg-white p-3">
                <dt className="text-xs font-semibold text-slate-700">{label}</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{summary[key]}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </section>
  );
};
