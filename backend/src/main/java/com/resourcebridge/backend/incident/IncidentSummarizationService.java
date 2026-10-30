package com.resourcebridge.backend.incident;

import com.resourcebridge.backend.resource.matching.OllamaFailureClassifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;

import java.util.UUID;

@Service
public class IncidentSummarizationService {

    private static final Logger log = LoggerFactory.getLogger(IncidentSummarizationService.class);

    private final IncidentReportService incidentReportService;
    private final OllamaIncidentSummarizer summarizer;

    public IncidentSummarizationService(IncidentReportService incidentReportService,
                                       OllamaIncidentSummarizer summarizer) {
        this.incidentReportService = incidentReportService;
        this.summarizer = summarizer;
    }

    public IncidentSummaryResponse summarize(UUID incidentId, String username) {
        IncidentReport report = incidentReportService.getAuthorizedReport(incidentId, username);
        String reportText = report.getReportText();
        if (reportText == null || reportText.isBlank() || reportText.length() > 10000) {
            throw new IncidentReportService.IncidentValidationException(
                    "Incident report must contain 1 to 10,000 characters.");
        }
        try {
            IncidentSummaryFields summary = summarizer.summarize(reportText);
            return IncidentSummaryResponse.draft(incidentId, summary);
        } catch (RestClientResponseException exception) {
            log.warn("Local incident summarization failed with Ollama HTTP status {}",
                    exception.getStatusCode().value());
            throw new IncidentSummarizationUnavailableException(
                    "The local AI service returned an error. Check its model and endpoint configuration.");
        } catch (ResourceAccessException exception) {
            OllamaFailureClassifier.FailureType failureType =
                    OllamaFailureClassifier.classify(exception);
            log.warn("Local incident summarization {} ({})",
                    failureType.name().toLowerCase(java.util.Locale.ROOT),
                    exception.getMostSpecificCause().getClass().getSimpleName());
            throw new IncidentSummarizationUnavailableException(switch (failureType) {
                case TIMEOUT -> "The local AI request timed out. Please retry.";
                case CONNECTION -> "The local AI service could not be reached. Check the Ollama service and retry.";
                case OTHER -> "Local AI summarization is temporarily unavailable. Please retry.";
            });
        } catch (RestClientException exception) {
            log.warn("Local incident summarization failed ({})", exception.getClass().getSimpleName());
            throw new IncidentSummarizationUnavailableException();
        } catch (OllamaIncidentSummarizer.InvalidIncidentSummaryException exception) {
            log.warn("Local incident summarization returned invalid output");
            throw new IncidentSummarizationUnavailableException(
                    "The local AI returned an invalid summary. Please retry.");
        }
    }

    public static class IncidentSummarizationUnavailableException extends RuntimeException {
        public IncidentSummarizationUnavailableException() {
            super("Local AI summarization is temporarily unavailable. Please retry.");
        }

        public IncidentSummarizationUnavailableException(String message) {
            super(message);
        }
    }
}
