import React, { useState } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ApiClientError } from '../../services/api';
import { IncidentReport, IncidentSummary, incidentService } from './incidentService';

interface IncidentReportsPanelProps {
  institutionId: string;
}

const SUMMARY_FIELDS: Array<{ key: keyof IncidentSummary; label: string }> = [
  { key: 'incidentSummary', label: 'Incident Summary' },
  { key: 'reportedIssue', label: 'Reported Issue' },
  { key: 'reportedDelay', label: 'Reported Delay' },
  { key: 'evidenceMentioned', label: 'Evidence Mentioned' },
  { key: 'suggestedNextAction', label: 'Suggested Next Action' },
  { key: 'missingInformation', label: 'Missing Information' },
];

export const IncidentReportsPanel: React.FC<IncidentReportsPanelProps> = ({ institutionId }) => {
  const [reportText, setReportText] = useState('');
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [incidentIdInput, setIncidentIdInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
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

  const createReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reportText.trim() || isSaving) return;
    setIsSaving(true);
    setError(null);
    setSummary(null);
    try {
      setReport(await incidentService.create(institutionId, reportText));
      setReportText('');
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
    } catch (reason) {
      showError(reason, 'Unable to load this incident report.');
    } finally {
      setIsLoadingReport(false);
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
      showError(reason, 'Local AI summarization failed. Check Ollama and retry.');
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
            Submit a report or open one you are authorized to review. Reports are visible to their author
            and active institution administrators.
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
              <h3 className="font-semibold text-slate-900">Original report</h3>
              <p className="break-all text-[11px] text-slate-500">Report ID: {report.id}</p>
            </div>
            <Button type="button" size="sm" onClick={generateSummary} isLoading={isSummarizing}
              leftIcon={<Sparkles className="h-4 w-4" aria-hidden />}>
              {isSummarizing ? 'Generating summary…' : 'Generate AI Summary'}
            </Button>
          </div>
          <blockquote className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
            {report.reportText}
          </blockquote>
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
