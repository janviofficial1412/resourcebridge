package com.resourcebridge.backend.image;

import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.Locale;
import java.util.Map;

@Component
public class ImageContentValidator {

    public static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final long MAX_PIXELS = 20_000_000L;
    private static final int MAX_DIMENSION = 10_000;
    private static final Map<String, DecodedImage> FORMATS = Map.of(
            "jpeg", new DecodedImage("image/jpeg", "jpg", 0, 0),
            "jpg", new DecodedImage("image/jpeg", "jpg", 0, 0),
            "png", new DecodedImage("image/png", "png", 0, 0),
            "webp", new DecodedImage("image/webp", "webp", 0, 0)
    );

    public DecodedImage validate(byte[] bytes) {
        if (bytes == null || bytes.length == 0 || bytes.length > MAX_BYTES) {
            throw new InvalidImageException("Image must be non-empty and no larger than 5 MB.");
        }
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            if (input == null) {
                throw invalidImage();
            }
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                throw invalidImage();
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, true);
                String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                DecodedImage supportedFormat = FORMATS.get(format);
                if (supportedFormat == null) {
                    throw invalidImage();
                }

                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || width > MAX_DIMENSION || height > MAX_DIMENSION
                        || (long) width * height > MAX_PIXELS) {
                    throw new InvalidImageException("Image dimensions exceed the supported safety limits.");
                }
                if (reader.read(0) == null) {
                    throw invalidImage();
                }
                return new DecodedImage(supportedFormat.contentType(), supportedFormat.extension(), width, height);
            } finally {
                reader.dispose();
            }
        } catch (IOException | RuntimeException exception) {
            if (exception instanceof InvalidImageException invalidImageException) {
                throw invalidImageException;
            }
            throw invalidImage();
        }
    }

    private static InvalidImageException invalidImage() {
        return new InvalidImageException("The file is not a valid, supported JPEG, PNG, or WebP image.");
    }

    public static class InvalidImageException extends RuntimeException {
        public InvalidImageException(String message) {
            super(message);
        }
    }
}
