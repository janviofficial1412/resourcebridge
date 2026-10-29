package com.resourcebridge.backend.resource.matching;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.net.Proxy;
import java.net.ProxySelector;
import java.net.SocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Configuration
class OllamaConfiguration {

    @Bean
    RestClient ollamaRestClient(
            @Value("${resourcebridge.ai.ollama.base-url:http://localhost:11434}") String baseUrl,
            @Value("${resourcebridge.ai.ollama.connect-timeout:2s}") Duration connectTimeout,
            @Value("${resourcebridge.ai.ollama.response-timeout:20s}") Duration responseTimeout) {
        URI endpoint = URI.create(baseUrl);
        String host = endpoint.getHost();
        host = host == null ? null : host.replace("[", "").replace("]", "").toLowerCase(Locale.ROOT);
        if (!"http".equalsIgnoreCase(endpoint.getScheme())
                || host == null
                || !Set.of("localhost", "127.0.0.1", "::1").contains(host)
                || endpoint.getUserInfo() != null
                || endpoint.getQuery() != null
                || endpoint.getFragment() != null) {
            throw new IllegalStateException("Ollama must be configured on a local loopback address");
        }
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(connectTimeout)
                .proxy(new ProxySelector() {
                    @Override
                    public List<Proxy> select(URI uri) {
                        return List.of(Proxy.NO_PROXY);
                    }

                    @Override
                    public void connectFailed(URI uri, SocketAddress address, IOException exception) {
                        throw new IllegalStateException("Unexpected proxy connection failure", exception);
                    }
                })
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(responseTimeout);
        return RestClient.builder().baseUrl(baseUrl).requestFactory(requestFactory).build();
    }
}
