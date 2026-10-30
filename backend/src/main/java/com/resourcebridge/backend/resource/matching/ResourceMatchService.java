package com.resourcebridge.backend.resource.matching;

import com.resourcebridge.backend.booking.BookingRepository;
import com.resourcebridge.backend.image.ImageAssetService;
import com.resourcebridge.backend.resource.Resource;
import com.resourcebridge.backend.resource.ResourceResponse;
import com.resourcebridge.backend.resource.ResourceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ResourceMatchService {

    private static final Logger log = LoggerFactory.getLogger(ResourceMatchService.class);
    private static final Pattern WORDS = Pattern.compile("[\\p{L}\\p{N}]{3,}");
    private static final Pattern DURATION = Pattern.compile(
            "(?i)\\b(\\d{1,4}|one|two|three|four|five|six|seven|eight|nine|ten)\\s*"
                    + "(minutes?|mins?|hours?|hrs?|days?|weeks?)\\b");
    private static final Pattern PROXIMITY_TERMS = Pattern.compile(
            "(?i)\\b(near|nearby|close|proximity|walking distance)\\b");
    private static final Map<String, String> MATCHING_SYNONYMS = Map.ofEntries(
            Map.entry("laptop", "computer"),
            Map.entry("notebook", "computer"),
            Map.entry("pc", "computer"),
            Map.entry("coding", "programming"),
            Map.entry("code", "programming"),
            Map.entry("software", "programming"),
            Map.entry("develop", "programming"),
            Map.entry("development", "programming"),
            Map.entry("programmer", "programming"),
            Map.entry("photography", "camera"),
            Map.entry("photographic", "camera"),
            Map.entry("photo", "camera"),
            Map.entry("workspace", "space"),
            Map.entry("office", "space"),
            Map.entry("room", "space"),
            Map.entry("studio", "space"),
            Map.entry("laboratory", "lab"));
    private static final Map<String, Integer> NUMBER_WORDS = Map.of(
            "one", 1, "two", 2, "three", 3, "four", 4, "five", 5,
            "six", 6, "seven", 7, "eight", 8, "nine", 9, "ten", 10);
    private static final Set<String> STOP_WORDS = Set.of(
            "the", "and", "for", "with", "that", "this", "from", "need", "want",
            "looking", "find", "resource", "resources", "preferably", "near", "institution",
            "available", "please", "use", "using", "borrow", "borrower", "days", "day",
            "weeks", "week", "hours", "hour", "minutes", "minute", "mins", "hrs",
            "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten");

    private final ResourceService resourceService;
    private final BookingRepository bookingRepository;
    private final OllamaClient ollamaClient;
    private final ObjectMapper objectMapper;
    private final ImageAssetService imageAssetService;

    public ResourceMatchService(ResourceService resourceService,
                                BookingRepository bookingRepository,
                                OllamaClient ollamaClient,
                                ObjectMapper objectMapper,
                                ImageAssetService imageAssetService) {
        this.resourceService = resourceService;
        this.bookingRepository = bookingRepository;
        this.ollamaClient = ollamaClient;
        this.objectMapper = objectMapper;
        this.imageAssetService = imageAssetService;
    }

    private static boolean containsMatchingTerm(String value, String keyword) {
        Matcher words = WORDS.matcher(value.toLowerCase(Locale.ROOT));
        String normalizedKeyword = normalizeMatchingTerm(keyword);
        while (words.find()) {
            if (normalizeMatchingTerm(words.group()).equals(normalizedKeyword)) {
                return true;
            }
        }
        return false;
    }

    private static String normalizeMatchingTerm(String term) {
        String normalized = MATCHING_SYNONYMS.getOrDefault(term, term);
        if (normalized.length() > 5 && normalized.endsWith("ing")) {
            normalized = normalized.substring(0, normalized.length() - 3);
        } else if (normalized.length() > 4 && normalized.endsWith("ed")) {
            normalized = normalized.substring(0, normalized.length() - 2);
        } else if (normalized.length() > 4 && normalized.endsWith("s")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private static Integer requestedDurationMinutes(ResourceMatchRequest request, Integer parsedDurationMinutes) {
        long bookingWindowMinutes = request.startTime() == null ? 0
                : Duration.between(request.startTime(), request.endTime()).toMinutes();
        long requestedMinutes = Math.max(parsedDurationMinutes == null ? 0 : parsedDurationMinutes,
                bookingWindowMinutes);
        return requestedMinutes > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) requestedMinutes;
    }

    @Transactional(readOnly = true)
    public ResourceMatchResponse match(ResourceMatchRequest request, String username) {
        validateRequest(request);
        String query = request.request().trim();
        SearchCriteria criteria = interpretRequest(query);
        List<Resource> eligible = resourceService.discoverResources(
                        request.institutionId(),
                        request.search(),
                        request.categoryId(),
                        request.resourceType(),
                        request.conditionRating(),
                        username)
                .stream()
                .filter(resource -> resource.getStatus()
                        == com.resourcebridge.backend.resource.ResourceStatus.AVAILABLE)
                .filter(resource -> "ACTIVE".equalsIgnoreCase(resource.getOwnerMembership().getStatus()))
                .filter(resource -> !resource.getOwnerMembership().getUser().getUsername()
                        .equalsIgnoreCase(username))
                .filter(resource -> supportsDuration(
                        resource, requestedDurationMinutes(request, criteria.durationMinutes())))
                .filter(resource -> hasNoBookingConflict(resource, request))
                .sorted(Comparator.comparingInt((Resource resource) -> matchScore(resource, criteria.keywords()))
                        .reversed()
                        .thenComparing(resource -> resource.getName().toLowerCase(Locale.ROOT)))
                .toList();

        boolean bookingWindowChecked = request.startTime() != null;
        if (eligible.isEmpty()) {
            return response(ResourceMatchResponse.RankingMethod.DETERMINISTIC, bookingWindowChecked,
                    List.of(), "No eligible resources matched your request.");
        }

        List<Candidate> candidates = eligible.stream().map(Candidate::from).toList();
        try {
            List<RankedEvidence> ranking = parseRanking(ollamaClient.rank(query, candidates), candidates);
            Map<UUID, Resource> resourcesById = eligible.stream().collect(
                    Collectors.toMap(Resource::getId, resource -> resource));
            Map<UUID, UUID> imageIds = imageIdsFor(eligible);
            List<ResourceMatchResponse.Match> matches = ranking.stream()
                    .filter(RankedEvidence::relevant)
                    .map(item -> new ResourceMatchResponse.Match(
                            ResourceResponse.from(resourcesById.get(item.id()), imageIds.get(item.id())),
                            "Matches your request based on: “" + item.evidence() + "”"))
                    .toList();
            return response(ResourceMatchResponse.RankingMethod.AI, bookingWindowChecked, matches,
                    responseMessage(bookingWindowChecked, criteria.proximityRequested()));
        } catch (RuntimeException exception) {
            if (!(exception instanceof RestClientException)
                    && !(exception instanceof OllamaClient.InvalidOllamaResponseException)
                    && !(exception instanceof InvalidRankingException)) {
                throw exception;
            }
            OllamaFailureClassifier.FailureType failureType = exception instanceof RestClientException
                    ? OllamaFailureClassifier.classify(exception)
                    : OllamaFailureClassifier.FailureType.OTHER;
            log.warn("Local AI matching unavailable or returned invalid output; using deterministic ranking "
                            + "(failureType={}, exception={})",
                    failureType, exception.getClass().getSimpleName());
            List<ResourceMatchResponse.Match> fallbackMatches = fallbackMatches(eligible, criteria.keywords());
            String fallbackReason = exception instanceof RestClientException
                    ? switch (failureType) {
                        case TIMEOUT -> "Local AI ranking timed out; deterministic fallback results are shown. ";
                        case CONNECTION -> "The local AI service could not be reached; deterministic fallback results are shown. ";
                        case OTHER -> "Local AI ranking could not be completed; deterministic fallback results are shown. ";
                    }
                    : "Local AI returned invalid ranking data; deterministic fallback results are shown. ";
            String fallbackMessage = fallbackMatches.isEmpty()
                    ? fallbackReason + "No eligible resources were retrieved."
                    : fallbackReason
                    + responseMessage(bookingWindowChecked, criteria.proximityRequested());
            return response(ResourceMatchResponse.RankingMethod.DETERMINISTIC, bookingWindowChecked,
                    fallbackMatches, fallbackMessage);
        }
    }

    private ResourceMatchResponse response(ResourceMatchResponse.RankingMethod method,
                                           boolean bookingWindowChecked,
                                           List<ResourceMatchResponse.Match> matches,
                                           String message) {
        return new ResourceMatchResponse(method, bookingWindowChecked, message, matches);
    }

    private List<ResourceMatchResponse.Match> fallbackMatches(List<Resource> resources, List<String> keywords) {
        Map<UUID, UUID> imageIds = imageIdsFor(resources);
        List<Resource> keywordMatches = resources.stream()
                .sorted(Comparator.comparingInt((Resource resource) -> matchScore(resource, keywords))
                        .reversed()
                        .thenComparing(resource -> resource.getName().toLowerCase(Locale.ROOT)))
                .filter(resource -> !keywords.isEmpty() && matchScore(resource, keywords) > 0)
                .toList();
        if (keywordMatches.isEmpty()) {
            return resources.stream()
                    .sorted(Comparator.comparing(resource -> resource.getName().toLowerCase(Locale.ROOT)))
                    .map(resource -> new ResourceMatchResponse.Match(
                            ResourceResponse.from(resource, imageIds.get(resource.getId())),
                            "AI ranking is unavailable. This resource is eligible under the selected filters, "
                                    + "but its relevance to your request could not be confirmed."))
                    .toList();
        }
        return keywordMatches.stream()
                .map(resource -> {
                    String evidence = List.of(
                                    resource.getName(),
                                    resource.getCategory().getName(),
                                    resource.getDescription())
                            .stream()
                            .filter(value -> value != null && keywords.stream()
                                    .anyMatch(keyword -> containsMatchingTerm(value, keyword)))
                            .findFirst()
                            .orElse(resource.getName());
                    return new ResourceMatchResponse.Match(
                            ResourceResponse.from(resource, imageIds.get(resource.getId())),
                            "Matched your request against the resource details: “" + evidence + "”");
                })
                .toList();
    }

    private List<RankedEvidence> parseRanking(String response, List<Candidate> candidates) {
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode matchesNode = root.path("matches");
            if (!matchesNode.isArray() || matchesNode.size() > candidates.size()) {
                throw new InvalidRankingException();
            }
            Map<UUID, Candidate> byId = candidates.stream()
                    .collect(Collectors.toMap(Candidate::id, candidate -> candidate));
            Set<UUID> seen = new HashSet<>();
            List<RankedEvidence> ranking = new ArrayList<>();
            for (JsonNode match : matchesNode) {
                UUID id = UUID.fromString(match.path("id").asText());
                String evidence = match.path("evidence").asText();
                Candidate candidate = byId.get(id);
                JsonNode relevantNode = match.path("relevant");
                if (candidate == null || !seen.add(id) || !relevantNode.isBoolean()
                        || evidence.length() > 160
                        || (relevantNode.asBoolean()
                        && (evidence.isBlank() || !candidate.containsEvidence(evidence)))) {
                    throw new InvalidRankingException();
                }
                ranking.add(new RankedEvidence(id, relevantNode.asBoolean(), evidence));
            }
            if (ranking.stream().noneMatch(RankedEvidence::relevant)) {
                throw new InvalidRankingException();
            }
            return ranking;
        } catch (InvalidRankingException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new InvalidRankingException();
        }
    }

    private Map<UUID, UUID> imageIdsFor(List<Resource> resources) {
        Set<UUID> resourceIds = resources.stream().map(Resource::getId).collect(Collectors.toSet());
        return imageAssetService.getResourceImageIds(resourceIds);
    }

    private boolean hasNoBookingConflict(Resource resource, ResourceMatchRequest request) {
        if (request.startTime() == null) {
            return true;
        }
        return bookingRepository.countOverlappingActiveBookings(
                resource.getId(), request.startTime(), request.endTime(), null) == 0;
    }

    private static boolean supportsDuration(Resource resource, Integer requestedDurationMinutes) {
        return requestedDurationMinutes == null
                || resource.getMaxBookingMinutes() == null
                || resource.getMaxBookingMinutes() >= requestedDurationMinutes;
    }

    private static int matchScore(Resource resource, List<String> keywords) {
        Matcher words = WORDS.matcher(searchableFields(resource).toLowerCase(Locale.ROOT));
        Set<String> resourceWords = new HashSet<>();
        while (words.find()) {
            resourceWords.add(normalizeMatchingTerm(words.group()));
        }
        return (int) keywords.stream()
                .map(ResourceMatchService::normalizeMatchingTerm)
                .filter(resourceWords::contains)
                .count();
    }

    private static String searchableFields(Resource resource) {
        return String.join(" ",
                resource.getName(),
                resource.getDescription(),
                resource.getCategory().getName(),
                resource.getInstitution().getName(),
                resource.getLocation() == null ? "" : resource.getLocation(),
                resource.getResourceType().name());
    }

    private static List<String> extractKeywords(String request) {
        Matcher matcher = WORDS.matcher(request.toLowerCase(Locale.ROOT));
        List<String> keywords = new ArrayList<>();
        while (matcher.find()) {
            String word = matcher.group();
            if (!STOP_WORDS.contains(word) && !keywords.contains(word)) {
                keywords.add(word);
            }
        }
        return keywords;
    }

    private static Integer extractDurationMinutes(String request) {
        Matcher matcher = DURATION.matcher(request);
        if (!matcher.find()) {
            return null;
        }
        String quantityText = matcher.group(1).toLowerCase(Locale.ROOT);
        int quantity = NUMBER_WORDS.getOrDefault(quantityText, parseInteger(quantityText));
        String unit = matcher.group(2).toLowerCase(Locale.ROOT);
        long multiplier = unit.startsWith("week") ? 10080
                : unit.startsWith("day") ? 1440
                : unit.startsWith("hour") || unit.startsWith("hr") ? 60 : 1;
        long minutes = quantity * multiplier;
        return minutes <= Integer.MAX_VALUE ? (int) minutes : Integer.MAX_VALUE;
    }

    private static int parseInteger(String value) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException exception) {
            return 0;
        }
    }

    private static String responseMessage(boolean bookingWindowChecked, boolean proximityRequested) {
        String message = bookingWindowChecked
                ? "Resources were checked against your requested booking window."
                : "Booking times are not confirmed because no time window was supplied.";
        if (proximityRequested) {
            message += " Physical distance cannot be determined from the available location data.";
        }
        return message;
    }

    private static SearchCriteria interpretRequest(String request) {
        return new SearchCriteria(
                extractKeywords(request),
                extractDurationMinutes(request),
                PROXIMITY_TERMS.matcher(request).find());
    }

    private static void validateRequest(ResourceMatchRequest request) {
        if (request == null || request.request() == null || request.request().isBlank()
                || request.request().length() > 1000) {
            throw new MatchValidationException("Request must contain 1 to 1000 characters.");
        }
        if (request.search() != null && request.search().length() > 1000) {
            throw new MatchValidationException("Discovery search must not exceed 1000 characters.");
        }
        if ((request.startTime() == null) != (request.endTime() == null)) {
            throw new MatchValidationException("Both booking start and end times are required.");
        }
        if (request.startTime() != null) {
            if (!request.startTime().isBefore(request.endTime())) {
                throw new MatchValidationException("Booking start time must precede end time.");
            }
            if (request.startTime().isBefore(Instant.now().minus(Duration.ofMinutes(1)))) {
                throw new MatchValidationException("Booking start time cannot be in the past.");
            }
            long durationMinutes = Duration.between(request.startTime(), request.endTime()).toMinutes();
            if (durationMinutes <= 0) {
                throw new MatchValidationException("Booking duration must be at least one minute.");
            }
        }
    }

    public record Candidate(
            UUID id,
            String name,
            String description,
            String categoryName,
            String institutionName,
            String resourceType,
            String location
    ) {
        static Candidate from(Resource resource) {
            return new Candidate(
                    resource.getId(),
                    resource.getName(),
                    resource.getDescription() == null ? "" : resource.getDescription().substring(
                            0, Math.min(resource.getDescription().length(), 800)),
                    resource.getCategory().getName(),
                    resource.getInstitution().getName(),
                    resource.getResourceType().name(),
                    resource.getLocation());
        }

        boolean containsEvidence(String evidence) {
            return List.of(name, description, categoryName, institutionName,
                            resourceType, location == null ? "" : location)
                    .stream()
                    .anyMatch(value -> value.toLowerCase(Locale.ROOT).contains(evidence.toLowerCase(Locale.ROOT)));
        }
    }

    private record SearchCriteria(
            List<String> keywords,
            Integer durationMinutes,
            boolean proximityRequested
    ) {
    }

    private record RankedEvidence(UUID id, boolean relevant, String evidence) {
    }

    public static final class InvalidRankingException extends RuntimeException {
    }

    public static final class MatchValidationException extends RuntimeException {
        public MatchValidationException(String message) {
            super(message);
        }
    }
}
