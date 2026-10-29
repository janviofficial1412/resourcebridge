package com.resourcebridge.backend.resource.matching;

import com.resourcebridge.backend.booking.BookingRepository;
import com.resourcebridge.backend.image.ImageAssetService;
import com.resourcebridge.backend.identity.AppUser;
import com.resourcebridge.backend.institution.Institution;
import com.resourcebridge.backend.institution.Membership;
import com.resourcebridge.backend.resource.ConditionRating;
import com.resourcebridge.backend.resource.Resource;
import com.resourcebridge.backend.resource.ResourceCategory;
import com.resourcebridge.backend.resource.ResourceService;
import com.resourcebridge.backend.resource.ResourceService.ResourceAccessDeniedException;
import com.resourcebridge.backend.resource.ResourceStatus;
import com.resourcebridge.backend.resource.ResourceType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.ResourceAccessException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.InputStream;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ResourceMatchServiceTest {

    @Mock
    private ResourceService resourceService;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private OllamaClient ollamaClient;
    @Mock
    private ImageAssetService imageAssetService;

    private ResourceMatchService service;
    private Resource laptop;
    private Resource camera;
    private UUID institutionId;
    private UUID categoryId;

    @BeforeEach
    void setUp() {
        service = new ResourceMatchService(
                resourceService, bookingRepository, ollamaClient,
                new ObjectMapper(), imageAssetService);
        lenient().when(imageAssetService.getResourceImageIds(any())).thenReturn(Map.of());

        institutionId = UUID.randomUUID();
        categoryId = UUID.randomUUID();
        Institution institution = new Institution("North College", "north-college", "UTC");
        ReflectionTestUtils.setField(institution, "id", institutionId);
        AppUser owner = new AppUser("owner", "owner@example.test", "hash", "Resource Owner");
        ReflectionTestUtils.setField(owner, "id", UUID.randomUUID());
        Membership ownerMembership = new Membership(owner, institution, "MEMBER", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(ownerMembership, "id", UUID.randomUUID());
        ResourceCategory category = new ResourceCategory(institution, "Computing", "Computer equipment");
        ReflectionTestUtils.setField(category, "id", categoryId);

        laptop = resource(institution, ownerMembership, category, "Development laptop",
                "Laptop suitable for Python development", ResourceType.EQUIPMENT, 6000);
        camera = resource(institution, ownerMembership, category, "Digital camera",
                "Camera for photography", ResourceType.EQUIPMENT, 120);
        lenient().when(resourceService.discoverResources(any(), any(), any(), any(), any(), eq("requester")))
                .thenReturn(List.of(laptop, camera));
    }

    @Test
    void aiRankingUsesOnlyKnownCandidatesAndGroundedEvidence() {
        when(ollamaClient.rank(eq("I need a laptop for Python development"), any()))
                .thenReturn("""
                        {"matches":[
                          {"id":"%s","relevant":true,"evidence":"Laptop suitable for Python development"},
                          {"id":"%s","relevant":false,"evidence":""}
                        ]}
                        """.formatted(laptop.getId(), camera.getId()));

        ResourceMatchResponse response = service.match(
                new ResourceMatchRequest("I need a laptop for Python development",
                        institutionId, categoryId, null, null, null, null),
                "requester");

        assertEquals(ResourceMatchResponse.RankingMethod.AI, response.rankingMethod());
        assertEquals(laptop.getId(), response.matches().getFirst().resource().id());
        assertTrue(response.matches().getFirst().explanation().contains("Laptop suitable for Python development"));
        assertFalse(response.bookingWindowChecked());
        verify(resourceService).discoverResources(
                eq(institutionId), isNull(), eq(categoryId), isNull(), isNull(), eq("requester"));
        verify(bookingRepository, never()).countOverlappingActiveBookings(any(), any(), any(), any());
    }

    @Test
    void existingDiscoverySearchIsForwardedAndInstitutionAccessRemainsScoped() {
        when(ollamaClient.rank(any(), any())).thenReturn("""
                        {"matches":[
                          {"id":"%s","relevant":true,"evidence":"Laptop suitable for Python development"},
                          {"id":"%s","relevant":false,"evidence":""}
                        ]}
                        """.formatted(laptop.getId(), camera.getId()));

        service.match(new ResourceMatchRequest(
                        "Python laptop", institutionId, categoryId, null, null, null, null, "portable"),
                "requester");

        verify(resourceService).discoverResources(
                eq(institutionId), eq("portable"), eq(categoryId), isNull(),
                isNull(), eq("requester"));

        UUID foreignInstitutionId = UUID.randomUUID();
        when(resourceService.discoverResources(
                eq(foreignInstitutionId), any(), any(), any(), any(), eq("requester")))
                .thenThrow(new ResourceAccessDeniedException("You do not have access to this institution"));
        assertThrows(ResourceAccessDeniedException.class, () -> service.match(
                new ResourceMatchRequest("Python laptop", foreignInstitutionId, null, null, null, null, null),
                "requester"));
        verify(ollamaClient, times(1)).rank(any(), any());
    }

    @Test
    void deterministicFallbackIsUsedWhenOllamaIsUnavailable() {
        when(ollamaClient.rank(any(), any())).thenThrow(new ResourceAccessException("connection failed"));

        ResourceMatchResponse response = service.match(
                new ResourceMatchRequest("laptop Python", institutionId, null, null, null, null, null),
                "requester");

        assertEquals(ResourceMatchResponse.RankingMethod.DETERMINISTIC, response.rankingMethod());
        assertEquals(laptop.getId(), response.matches().getFirst().resource().id());
        assertTrue(response.matches().getFirst().explanation().toLowerCase().contains("laptop"));
        assertTrue(response.message().contains("deterministic fallback results are shown"));
    }

    @Test
    void ollamaFailureShowsEligibleCandidatesWhenNoKeywordOverlapAndDistinguishesEmptyRetrieval() {
        when(ollamaClient.rank(any(), any())).thenThrow(new ResourceAccessException("connection failed"));

        ResourceMatchResponse fallbackResponse = service.match(
                new ResourceMatchRequest("woodworking tools", institutionId, null, null, null, null, null),
                "requester");

        assertEquals(2, fallbackResponse.matches().size());
        assertTrue(fallbackResponse.matches().stream().allMatch(match ->
                match.explanation().contains("relevance to your request could not be confirmed")));
        assertTrue(fallbackResponse.message().contains("AI ranking could not be completed"));

        when(resourceService.discoverResources(any(), any(), any(), any(), any(), eq("requester")))
                .thenReturn(List.of());
        ResourceMatchResponse emptyDiscoveryResponse = service.match(
                new ResourceMatchRequest("woodworking tools", institutionId, null, null, null, null, null),
                "requester");

        assertTrue(emptyDiscoveryResponse.matches().isEmpty());
        assertTrue(emptyDiscoveryResponse.message().contains("No eligible resources matched"));
    }

    @Test
    void curatedFallbackEvaluationCasesFindRelevantEligibleResources() throws Exception {
        when(ollamaClient.rank(any(), any())).thenThrow(new ResourceAccessException("local Ollama unavailable"));
        try (InputStream casesStream = getClass().getResourceAsStream(
                "/evaluation/resource-matching-cases.json")) {
            assertTrue(casesStream != null);
            JsonNode cases = new ObjectMapper().readTree(casesStream).path("cases");
            int relevantCases = 0;
            int relevantCasesFound = 0;
            for (JsonNode evaluationCase : cases) {
                ResourceMatchResponse response = service.match(new ResourceMatchRequest(
                        evaluationCase.path("query").asText(),
                        institutionId, null, null, null, null, null), "requester");
                if ("UNRANKED_ELIGIBLE".equals(evaluationCase.path("expectedBehavior").asText())) {
                    assertEquals(2, response.matches().size(), evaluationCase.path("id").asText());
                    assertTrue(response.matches().stream().allMatch(match ->
                            match.explanation().contains("relevance to your request could not be confirmed")));
                } else {
                    relevantCases++;
                    String expectedResource = evaluationCase.path("expectedResource").asText();
                    boolean foundExpected = response.matches().stream().anyMatch(match ->
                            expectedResource.equals(match.resource().name()));
                    if (foundExpected) relevantCasesFound++;
                    assertTrue(foundExpected, evaluationCase.path("id").asText());
                }
                assertTrue(response.matches().stream().allMatch(match ->
                        match.resource().institutionId().equals(institutionId)
                                && match.resource().status() == ResourceStatus.AVAILABLE),
                        evaluationCase.path("id").asText());
            }
            assertTrue(relevantCases > 0);
            assertEquals(relevantCases, relevantCasesFound,
                    "Eligible recall should be 100% across the curated fallback cases");
        }
    }

    @Test
    void emptyOllamaRankingFallsBackToEquivalentMeaningTerms() {
        when(ollamaClient.rank(any(), any())).thenReturn("""
                {"matches":[
                  {"id":"%s","relevant":false,"evidence":""},
                  {"id":"%s","relevant":false,"evidence":""}
                ]}
                """.formatted(laptop.getId(), camera.getId()));

        ResourceMatchResponse response = service.match(
                new ResourceMatchRequest("I need a portable notebook to write software",
                        null, null, null, null, null, null),
                "requester");

        assertEquals(ResourceMatchResponse.RankingMethod.DETERMINISTIC, response.rankingMethod());
        assertEquals(1, response.matches().size());
        assertEquals(laptop.getId(), response.matches().getFirst().resource().id());
        assertTrue(response.matches().getFirst().explanation().contains("Development laptop"));
    }

    @Test
    void incompleteOllamaRankingFallsBackInsteadOfReturningPartialAiResults() {
        when(ollamaClient.rank(any(), any())).thenReturn("""
                {"matches":[
                  {"id":"%s","relevant":true,"evidence":"Laptop suitable for Python development"}
                ]}
                """.formatted(laptop.getId()));

        ResourceMatchResponse response = service.match(
                new ResourceMatchRequest("laptop Python", null, null, null, null, null, null),
                "requester");

        assertEquals(ResourceMatchResponse.RankingMethod.DETERMINISTIC, response.rankingMethod());
        assertEquals(laptop.getId(), response.matches().getFirst().resource().id());
    }

    @Test
    void ollamaResponseTimeoutUsesDeterministicFallback() {
        when(ollamaClient.rank(any(), any())).thenThrow(new ResourceAccessException("response timeout"));

        ResourceMatchResponse response = service.match(
                new ResourceMatchRequest("laptop Python", institutionId, null, null, null, null, null),
                "requester");

        assertEquals(ResourceMatchResponse.RankingMethod.DETERMINISTIC, response.rankingMethod());
        assertEquals(laptop.getId(), response.matches().getFirst().resource().id());
    }

    @Test
    void malformedRankingAndHallucinatedEvidenceFallBack() {
        when(ollamaClient.rank(any(), any())).thenReturn("""
                {"matches":[
                  {"id":"%s","relevant":true,"evidence":"This proves a guaranteed free booking"},
                  {"id":"%s","relevant":false,"evidence":""}
                ]}
                """.formatted(laptop.getId(), camera.getId()));

        ResourceMatchResponse response = service.match(
                new ResourceMatchRequest("laptop Python", null, null, null, null, null, null),
                "requester");

        assertEquals(ResourceMatchResponse.RankingMethod.DETERMINISTIC, response.rankingMethod());
        assertEquals(laptop.getId(), response.matches().getFirst().resource().id());
    }

    @Test
    void unknownCandidateIdsAndDuplicateIdsAreRejected() {
        when(ollamaClient.rank(any(), any())).thenReturn("""
                {"matches":[
                  {"id":"%s","relevant":true,"evidence":"Laptop suitable for Python development"},
                  {"id":"%s","relevant":false,"evidence":""}
                ]}
                """.formatted(UUID.randomUUID(), camera.getId()));

        ResourceMatchResponse unknownIdResponse = service.match(
                new ResourceMatchRequest("laptop Python", null, null, null, null, null, null),
                "requester");
        assertEquals(ResourceMatchResponse.RankingMethod.DETERMINISTIC, unknownIdResponse.rankingMethod());

        when(ollamaClient.rank(any(), any())).thenReturn("""
                {"matches":[
                  {"id":"%s","relevant":true,"evidence":"Digital camera"},
                  {"id":"%s","relevant":true,"evidence":"Digital camera"}
                ]}
                """.formatted(camera.getId(), camera.getId()));
        ResourceMatchResponse duplicateResponse = service.match(
                new ResourceMatchRequest("laptop Python", null, null, null, null, null, null),
                "requester");
        assertEquals(ResourceMatchResponse.RankingMethod.DETERMINISTIC, duplicateResponse.rankingMethod());
    }

    @Test
    void durationAndBookingWindowFilterIneligibleResourcesBeforeModelCall() {
        Instant start = Instant.now().plusSeconds(3600);
        Instant end = start.plusSeconds(3 * 24 * 60 * 60);
        when(bookingRepository.countOverlappingActiveBookings(laptop.getId(), start, end, null)).thenReturn(0L);
        when(ollamaClient.rank(any(), any())).thenReturn("""
                {"matches":[{"id":"%s","relevant":true,"evidence":"Laptop suitable for Python development"}]}
                """.formatted(laptop.getId()));

        ResourceMatchResponse response = service.match(
                new ResourceMatchRequest("laptop for Python for three days",
                        null, null, null, null, start, end),
                "requester");

        assertEquals(1, response.matches().size());
        assertEquals(laptop.getId(), response.matches().getFirst().resource().id());
        assertTrue(response.bookingWindowChecked());
        verify(ollamaClient).rank(eq("laptop for Python for three days"), any());
        verify(bookingRepository).countOverlappingActiveBookings(laptop.getId(), start, end, null);
    }

    @Test
    void bookingConflictIsExcludedBeforeOllamaReceivesCandidates() {
        Instant start = Instant.now().plusSeconds(3600);
        Instant end = start.plusSeconds(3600);
        when(bookingRepository.countOverlappingActiveBookings(laptop.getId(), start, end, null)).thenReturn(1L);
        when(bookingRepository.countOverlappingActiveBookings(camera.getId(), start, end, null)).thenReturn(1L);

        ResourceMatchResponse response = service.match(
                new ResourceMatchRequest("laptop Python", null, null, null, null, start, end),
                "requester");

        assertTrue(response.matches().isEmpty());
        verify(ollamaClient, never()).rank(any(), any());
    }

    @Test
    void requestMustProvideBothBookingTimesAndAValidInterval() {
        assertThrows(ResourceMatchService.MatchValidationException.class, () -> service.match(
                new ResourceMatchRequest("laptop", null, null, null, null, Instant.now().plusSeconds(60), null),
                "requester"));
        assertThrows(ResourceMatchService.MatchValidationException.class, () -> service.match(
                new ResourceMatchRequest("laptop", null, null, null, null,
                        Instant.now().plusSeconds(3600), Instant.now().plusSeconds(1800)),
                "requester"));
    }

    @Test
    void resourcesOwnedByRequesterAreNeverRanked() {
        AppUser requester = new AppUser("requester", "requester@example.test", "hash", "Requester");
        ReflectionTestUtils.setField(requester, "id", UUID.randomUUID());
        Membership requesterMembership = new Membership(
                requester, laptop.getInstitution(), "MEMBER", "ACTIVE", Instant.now());
        ReflectionTestUtils.setField(requesterMembership, "id", UUID.randomUUID());
        Resource ownResource = resource(laptop.getInstitution(), requesterMembership, laptop.getCategory(),
                "Python laptop", "Laptop for Python", ResourceType.EQUIPMENT, 5000);
        when(resourceService.discoverResources(any(), any(), any(), any(), any(), eq("requester")))
                .thenReturn(List.of(ownResource));

        ResourceMatchResponse response = service.match(
                new ResourceMatchRequest("Python laptop", null, null, null, null, null, null),
                "requester");

        assertTrue(response.matches().isEmpty());
        verify(ollamaClient, never()).rank(any(), any());
    }

    @Test
    void inactiveResourceOwnerMembershipIsExcluded() {
        Membership inactiveOwner = new Membership(
                laptop.getOwnerMembership().getUser(),
                laptop.getInstitution(),
                "MEMBER",
                "INACTIVE",
                Instant.now());
        ReflectionTestUtils.setField(inactiveOwner, "id", UUID.randomUUID());
        Resource inactiveOwnerResource = resource(laptop.getInstitution(), inactiveOwner, laptop.getCategory(),
                "Laptop for Python", "Suitable for Python development", ResourceType.EQUIPMENT, 6000);
        when(resourceService.discoverResources(any(), any(), any(), any(), any(), eq("requester")))
                .thenReturn(List.of(inactiveOwnerResource));

        ResourceMatchResponse response = service.match(
                new ResourceMatchRequest("Python laptop", null, null, null, null, null, null),
                "requester");

        assertTrue(response.matches().isEmpty());
        verify(ollamaClient, never()).rank(any(), any());
    }

    @Test
    void unavailableResourcesAreExcludedBeforeRanking() {
        Resource unavailable = new Resource(
                laptop.getInstitution(), laptop.getOwnerMembership(), laptop.getCategory(),
                "Laptop for Python", "Suitable for Python development", ResourceType.EQUIPMENT,
                null, ConditionRating.GOOD, ResourceStatus.MAINTENANCE, true, 6000);
        ReflectionTestUtils.setField(unavailable, "id", UUID.randomUUID());
        when(resourceService.discoverResources(any(), any(), any(), any(), any(), eq("requester")))
                .thenReturn(List.of(unavailable));

        ResourceMatchResponse response = service.match(
                new ResourceMatchRequest("Python laptop", null, null, null, null, null, null),
                "requester");

        assertTrue(response.matches().isEmpty());
        verify(ollamaClient, never()).rank(any(), any());
    }

    @Test
    void emptyDiscoveryResultsAreARealEmptyResponseWithoutCallingOllama() {
        when(resourceService.discoverResources(any(), any(), any(), any(), any(), eq("requester")))
                .thenReturn(List.of());

        ResourceMatchResponse response = service.match(
                new ResourceMatchRequest("Python laptop", null, null, null, null, null, null),
                "requester");

        assertTrue(response.matches().isEmpty());
        verify(ollamaClient, never()).rank(any(), any());
    }

    @Test
    void naturalLanguageTypeHintDoesNotNarrowDatabaseCandidates() {
        when(ollamaClient.rank(any(), any())).thenReturn("""
                {"matches":[
                  {"id":"%s","relevant":true,"evidence":"Camera for photography"},
                  {"id":"%s","relevant":false,"evidence":""}
                ]}
                """.formatted(camera.getId(), laptop.getId()));

        service.match(new ResourceMatchRequest(
                "I need a camera that can photograph specimens",
                institutionId, null, null, null, null, null), "requester");

        verify(resourceService).discoverResources(
                eq(institutionId), isNull(), isNull(), isNull(), isNull(), eq("requester"));
    }

    @Test
    void locationPreferenceDoesNotClaimPhysicalDistance() {
        when(ollamaClient.rank(any(), any())).thenReturn("""
                {"matches":[
                  {"id":"%s","relevant":true,"evidence":"Laptop suitable for Python development"},
                  {"id":"%s","relevant":false,"evidence":""}
                ]}
                """.formatted(laptop.getId(), camera.getId()));

        ResourceMatchResponse response = service.match(
                new ResourceMatchRequest("laptop Python near my institution", null, null, null, null, null, null),
                "requester");

        assertTrue(response.message().contains("Physical distance cannot be determined"));
    }

    private static Resource resource(Institution institution,
                                    Membership ownerMembership,
                                    ResourceCategory category,
                                    String name,
                                    String description,
                                    ResourceType type,
                                    int maxBookingMinutes) {
        Resource resource = new Resource(
                institution, ownerMembership, category, name, description, type,
                null, ConditionRating.GOOD, ResourceStatus.AVAILABLE, true, maxBookingMinutes);
        ReflectionTestUtils.setField(resource, "id", UUID.randomUUID());
        return resource;
    }
}
