const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File, label = 'image'): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return `Choose a JPEG, PNG, or WebP ${label}.`;
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `The selected ${label} must be no larger than 5 MB.`;
  }
  return null;
}
