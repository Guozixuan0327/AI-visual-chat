/**
 * Compress and resize image from canvas
 * @param canvas - Source canvas element
 * @param maxWidth - Maximum width for resizing
 * @param maxHeight - Maximum height for resizing
 * @param quality - JPEG quality (0.0 to 1.0)
 * @returns Base64 encoded image string
 */
export function compressImageFromCanvas(
  canvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Calculate new dimensions maintaining aspect ratio
      let width = canvas.width;
      let height = canvas.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }

      // Create temporary canvas for resizing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const ctx = tempCanvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw resized image
      ctx.drawImage(canvas, 0, 0, width, height);

      // Convert to base64 with compression
      const imageData = tempCanvas.toDataURL('image/jpeg', quality);
      resolve(imageData);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Calculate pixel difference between two ImageData objects
 * @param data1 - First image data
 * @param data2 - Second image data
 * @returns Percentage of changed pixels (0-1)
 */
export function calculatePixelDifference(
  data1: ImageData,
  data2: ImageData
): number {
  if (data1.width !== data2.width || data1.height !== data2.height) {
    throw new Error('Image dimensions must match');
  }

  const totalPixels = data1.width * data1.height;
  let changedPixels = 0;
  const threshold = 30; // Pixel value difference threshold

  for (let i = 0; i < data1.data.length; i += 4) {
    const rDiff = Math.abs(data1.data[i] - data2.data[i]);
    const gDiff = Math.abs(data1.data[i + 1] - data2.data[i + 1]);
    const bDiff = Math.abs(data1.data[i + 2] - data2.data[i + 2]);

    if (rDiff + gDiff + bDiff > threshold * 3) {
      changedPixels++;
    }
  }

  return changedPixels / totalPixels;
}

/**
 * Generate a simple hash from image data for deduplication
 * @param imageData - Base64 encoded image
 * @returns Hash string
 */
export function generateImageHash(imageData: string): string {
  let hash = 0;
  const str = imageData.slice(0, 1000); // Use first 1000 chars for speed

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(36);
}

/**
 * Check if image is too dark or blurry
 * @param canvas - Canvas element with image
 * @returns True if image quality is poor
 */
export function isLowQualityImage(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return true;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Calculate average brightness
  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    totalBrightness += brightness;
  }

  const avgBrightness = totalBrightness / (data.length / 4);

  // Consider image too dark if average brightness < 30
  return avgBrightness < 30;
}
