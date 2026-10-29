package com.resourcebridge.backend.config;

import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

@Configuration(proxyBeanMethods = false)
public class DatabaseConfiguration {

    @Bean
    static BeanFactoryPostProcessor validateDatabaseConfiguration(Environment environment) {
        return beanFactory -> validate(environment);
    }

    static void validate(Environment environment) {
        boolean testProfile = environment.acceptsProfiles(Profiles.of("test"));
        String prefix = testProfile ? "TEST_" : "";
        String urlKey = prefix + "DB_URL";
        String usernameKey = prefix + "DB_USERNAME";
        String passwordKey = prefix + "DB_PASSWORD";

        String url = property(environment, urlKey);
        if (url == null || url.isBlank()) {
            throw new IllegalStateException(urlKey + " must be set to a PostgreSQL JDBC URL before startup.");
        }
        if (url.contains("${") || !hasPostgresHostAndDatabase(url)) {
            throw new IllegalStateException(
                    urlKey + " must be a resolved URL in the form jdbc:postgresql://<host>:<port>/<database>.");
        }
        requireValue(environment, usernameKey);
        requireValue(environment, passwordKey);
    }

    private static void requireValue(Environment environment, String key) {
        String value = property(environment, key);
        if (value == null || value.isBlank() || value.contains("${")) {
            throw new IllegalStateException(key + " must be set before startup.");
        }
    }

    private static String property(Environment environment, String key) {
        try {
            return environment.getProperty(key);
        } catch (IllegalArgumentException unresolvedPlaceholder) {
            throw new IllegalStateException(key + " must contain a resolved value before startup.");
        }
    }

    private static boolean hasPostgresHostAndDatabase(String url) {
        String prefix = "jdbc:postgresql://";
        if (!url.startsWith(prefix)) {
            return false;
        }

        String location = url.substring(prefix.length());
        int databaseSeparator = location.indexOf('/');
        if (databaseSeparator <= 0 || databaseSeparator == location.length() - 1) {
            return false;
        }
        String databaseAndOptions = location.substring(databaseSeparator + 1);
        int optionsSeparator = databaseAndOptions.indexOf('?');
        String database = optionsSeparator >= 0
                ? databaseAndOptions.substring(0, optionsSeparator)
                : databaseAndOptions;
        return !database.isBlank() && !url.chars().anyMatch(Character::isWhitespace);
    }
}
