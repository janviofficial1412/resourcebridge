package com.resourcebridge.backend.incident;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.ResourceAccessException;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class IncidentSummarizationServiceTest {

    @Test
    void summarizesOnlyTheAuthorizedOriginalAndDoesNotMutateIt() {
        IncidentReportService reportService = mock(IncidentReportService.class);
        OllamaIncidentSummarizer summarizer = mock(OllamaIncidentSummarizer.class);
        IncidentSummarizationService service = new IncidentSummarizationService(reportService, summarizer);
        IncidentReport report = mock(IncidentReport.class);
        UUID incidentId = UUID.randomUUID();
        String originalText = "The original report text must remain unchanged.";
        IncidentSummaryFields fields = new IncidentSummaryFields(
                "The reporter describes an issue.", "The reporter reports a problem.",
                "Not specified", "Not specified", "Review the report.", "Not specified");
        when(reportService.getAuthorizedReport(incidentId, "requester")).thenReturn(report);
        when(report.getReportText()).thenReturn(originalText);
        when(summarizer.summarize(originalText)).thenReturn(fields);

        IncidentSummaryResponse response = service.summarize(incidentId, "requester");

        assertEquals(incidentId, response.incidentId());
        assertEquals("AI-generated draft — requires human review", response.label());
        assertEquals(fields.incidentSummary(), response.incidentSummary());
        assertEquals(originalText, report.getReportText());
        verify(summarizer).summarize(originalText);
        verify(report, times(2)).getReportText();
    }

    @Test
    void authorizationFailureIsPropagatedBeforeCallingOllama() {
        IncidentReportService reportService = mock(IncidentReportService.class);
        OllamaIncidentSummarizer summarizer = mock(OllamaIncidentSummarizer.class);
        IncidentSummarizationService service = new IncidentSummarizationService(reportService, summarizer);
        UUID incidentId = UUID.randomUUID();
        when(reportService.getAuthorizedReport(incidentId, "requester"))
                .thenThrow(new IncidentReportService.IncidentAccessDeniedException());

        assertThrows(IncidentReportService.IncidentAccessDeniedException.class,
                () -> service.summarize(incidentId, "requester"));
        verify(summarizer, never()).summarize(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void modelTimeoutReturnsRetryableServiceError() {
        IncidentReportService reportService = mock(IncidentReportService.class);
        OllamaIncidentSummarizer summarizer = mock(OllamaIncidentSummarizer.class);
        IncidentSummarizationService service = new IncidentSummarizationService(reportService, summarizer);
        IncidentReport report = mock(IncidentReport.class);
        UUID incidentId = UUID.randomUUID();
        when(reportService.getAuthorizedReport(incidentId, "requester")).thenReturn(report);
        when(report.getReportText()).thenReturn("The original incident report.");
        when(summarizer.summarize("The original incident report."))
                .thenThrow(new ResourceAccessException(
                        "test timeout", new SocketTimeoutException("timed out")));

        IncidentSummarizationService.IncidentSummarizationUnavailableException exception = assertThrows(
                IncidentSummarizationService.IncidentSummarizationUnavailableException.class,
                () -> service.summarize(incidentId, "requester"));
        assertEquals("The local AI request timed out. Please retry.", exception.getMessage());
    }

    @Test
    void connectionFailureIsDistinguishableFromTimeout() {
        IncidentReportService reportService = mock(IncidentReportService.class);
        OllamaIncidentSummarizer summarizer = mock(OllamaIncidentSummarizer.class);
        IncidentSummarizationService service = new IncidentSummarizationService(reportService, summarizer);
        IncidentReport report = mock(IncidentReport.class);
        UUID incidentId = UUID.randomUUID();
        when(reportService.getAuthorizedReport(incidentId, "requester")).thenReturn(report);
        when(report.getReportText()).thenReturn("The original incident report.");
        when(summarizer.summarize("The original incident report."))
                .thenThrow(new ResourceAccessException("test connection", new ConnectException("refused")));

        IncidentSummarizationService.IncidentSummarizationUnavailableException exception = assertThrows(
                IncidentSummarizationService.IncidentSummarizationUnavailableException.class,
                () -> service.summarize(incidentId, "requester"));
        assertEquals(
                "The local AI service could not be reached. Check the Ollama service and retry.",
                exception.getMessage());
    }

    @Test
    void malformedOutputReturnsRetryableServiceError() {
        IncidentReportService reportService = mock(IncidentReportService.class);
        OllamaIncidentSummarizer summarizer = mock(OllamaIncidentSummarizer.class);
        IncidentSummarizationService service = new IncidentSummarizationService(reportService, summarizer);
        IncidentReport report = mock(IncidentReport.class);
        UUID incidentId = UUID.randomUUID();
        when(reportService.getAuthorizedReport(incidentId, "requester")).thenReturn(report);
        when(report.getReportText()).thenReturn("The original incident report.");
        when(summarizer.summarize("The original incident report."))
                .thenThrow(new OllamaIncidentSummarizer.InvalidIncidentSummaryException());

        assertThrows(IncidentSummarizationService.IncidentSummarizationUnavailableException.class,
                () -> service.summarize(incidentId, "requester"));
    }

    @Test
    void emptyAndExcessivelyLongStoredReportsAreRejectedBeforeOllama() {
        IncidentReportService reportService = mock(IncidentReportService.class);
        OllamaIncidentSummarizer summarizer = mock(OllamaIncidentSummarizer.class);
        IncidentSummarizationService service = new IncidentSummarizationService(reportService, summarizer);
        IncidentReport report = mock(IncidentReport.class);
        UUID incidentId = UUID.randomUUID();
        when(reportService.getAuthorizedReport(incidentId, "requester")).thenReturn(report);
        when(report.getReportText()).thenReturn("  ", "x".repeat(10001));

        assertThrows(IncidentReportService.IncidentValidationException.class,
                () -> service.summarize(incidentId, "requester"));
        assertThrows(IncidentReportService.IncidentValidationException.class,
                () -> service.summarize(incidentId, "requester"));
        verify(summarizer, never()).summarize(org.mockito.ArgumentMatchers.anyString());
    }
}
