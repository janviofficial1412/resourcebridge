package com.resourcebridge.backend.resource.matching;

import java.io.InterruptedIOException;
import java.net.ConnectException;
import java.net.NoRouteToHostException;
import java.net.SocketException;
import java.net.UnknownHostException;
import java.net.http.HttpTimeoutException;
import java.util.concurrent.TimeoutException;

public final class OllamaFailureClassifier {

    public enum FailureType {
        TIMEOUT,
        CONNECTION,
        OTHER
    }

    private OllamaFailureClassifier() {
    }

    public static FailureType classify(Throwable failure) {
        boolean connectionFailure = false;
        for (Throwable cause = failure; cause != null; cause = cause.getCause()) {
            if (cause instanceof HttpTimeoutException
                    || cause instanceof InterruptedIOException
                    || cause instanceof TimeoutException) {
                return FailureType.TIMEOUT;
            }
            if (cause instanceof ConnectException
                    || cause instanceof NoRouteToHostException
                    || cause instanceof UnknownHostException
                    || cause instanceof SocketException) {
                connectionFailure = true;
            }
        }
        return connectionFailure ? FailureType.CONNECTION : FailureType.OTHER;
    }
}
