package com.resourcebridge.backend.image;

import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ImageContentValidatorTest {

    private final ImageContentValidator validator = new ImageContentValidator();

    @Test
    void acceptsDecodedPngAndJpegBasedOnImageContents() throws Exception {
        DecodedImage png = validator.validate(encodedImage("png"));
        DecodedImage jpeg = validator.validate(encodedImage("jpeg"));

        assertEquals("image/png", png.contentType());
        assertEquals("image/jpeg", jpeg.contentType());
        assertEquals(2, png.width());
        assertEquals(2, jpeg.height());
    }

    @Test
    void acceptsDecodedWebp() {
        byte[] onePixelWebp = Base64.getDecoder().decode(
                "UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA");

        DecodedImage decoded = validator.validate(onePixelWebp);

        assertEquals("image/webp", decoded.contentType());
        assertEquals(1, decoded.width());
        assertEquals(1, decoded.height());
    }

    @Test
    void rejectsUnsupportedOrSpoofedImageBytes() {
        assertThrows(ImageContentValidator.InvalidImageException.class,
                () -> validator.validate("not an image".getBytes()));
        assertThrows(ImageContentValidator.InvalidImageException.class,
                () -> validator.validate(new byte[]{(byte) 0x89, 'P', 'N', 'G'}));
    }

    @Test
    void rejectsImagesOverFiveMegabytesBeforeDecoding() {
        assertThrows(ImageContentValidator.InvalidImageException.class,
                () -> validator.validate(new byte[(int) ImageContentValidator.MAX_BYTES + 1]));
    }

    private static byte[] encodedImage(String format) throws Exception {
        BufferedImage image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, format, output);
        return output.toByteArray();
    }
}
