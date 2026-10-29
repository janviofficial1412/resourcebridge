package com.resourcebridge.backend.image;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LocalImageStorageTest {

    @TempDir
    Path directory;

    @Test
    void writesAndReadsUsingGeneratedOpaqueKey() throws IOException {
        LocalImageStorage storage = new LocalImageStorage(directory.toString());
        String key = "a".repeat(64) + ".png";
        byte[] image = new byte[]{1, 2, 3};

        storage.store(key, image);

        assertArrayEquals(image, storage.open(key).readAllBytes());
        assertTrue(Files.exists(directory.resolve(key)));
    }

    @Test
    void rejectsUserSuppliedPathsAndNonGeneratedKeys() {
        LocalImageStorage storage = new LocalImageStorage(directory.toString());

        assertThrows(IllegalArgumentException.class, () -> storage.open("..\\secret.png"));
        assertThrows(IllegalArgumentException.class, () -> storage.open("../secret.png"));
        assertThrows(IllegalArgumentException.class, () -> storage.open("user-file.png"));
    }

    @Test
    void deletesOnlyTheResolvedStorageObject() throws IOException {
        LocalImageStorage storage = new LocalImageStorage(directory.toString());
        String key = "b".repeat(64) + ".webp";
        storage.store(key, new byte[]{4});

        storage.delete(key);

        assertFalse(Files.exists(directory.resolve(key)));
    }
}
