package com.resourcebridge.backend.image;

import java.io.IOException;
import java.io.InputStream;

public interface ImageStorage {
    void store(String storageKey, byte[] content) throws IOException;
    InputStream open(String storageKey) throws IOException;
    void delete(String storageKey) throws IOException;
}
