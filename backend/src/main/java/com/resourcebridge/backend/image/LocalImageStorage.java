package com.resourcebridge.backend.image;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.regex.Pattern;

@Component
public class LocalImageStorage implements ImageStorage {

    private static final Pattern STORAGE_KEY = Pattern.compile("[a-f0-9]{64}\\.(jpg|png|webp)");
    private final Path root;

    public LocalImageStorage(@Value("${resourcebridge.image-storage.local-directory}") String directory) {
        this.root = Path.of(directory).toAbsolutePath().normalize();
    }

    @Override
    public void store(String storageKey, byte[] content) throws IOException {
        Path target = resolve(storageKey);
        Files.createDirectories(root);
        Files.write(target, content, StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE);
    }

    @Override
    public InputStream open(String storageKey) throws IOException {
        return Files.newInputStream(resolve(storageKey), StandardOpenOption.READ);
    }

    @Override
    public void delete(String storageKey) throws IOException {
        Files.deleteIfExists(resolve(storageKey));
    }

    private Path resolve(String storageKey) {
        if (storageKey == null || !STORAGE_KEY.matcher(storageKey).matches()) {
            throw new IllegalArgumentException("Invalid generated image storage key");
        }
        Path target = root.resolve(storageKey).normalize();
        if (!target.startsWith(root)) {
            throw new IllegalArgumentException("Image storage path is outside the configured directory");
        }
        return target;
    }
}
