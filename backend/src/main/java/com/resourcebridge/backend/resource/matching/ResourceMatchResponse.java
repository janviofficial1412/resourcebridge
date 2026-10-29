package com.resourcebridge.backend.resource.matching;

import com.resourcebridge.backend.resource.ResourceResponse;

import java.util.List;

public record ResourceMatchResponse(
        RankingMethod rankingMethod,
        boolean bookingWindowChecked,
        String message,
        List<Match> matches
) {
    public enum RankingMethod {
        AI,
        DETERMINISTIC
    }

    public record Match(ResourceResponse resource, String explanation) {
    }
}
