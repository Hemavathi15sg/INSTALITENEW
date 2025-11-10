import { HfInference } from '@huggingface/inference';
import * as fs from 'fs';
import * as path from 'path';

const HF_TOKEN = process.env.HUGGINGFACE_API_KEY || '';

/**
 * Service for generating image captions using AI
 */
export class CaptionService {
  private hf: HfInference;
  private readonly UPLOAD_DIR = path.resolve('uploads');

  constructor() {
    this.hf = new HfInference(HF_TOKEN);
  }

  /**
   * Validate that the file path is within the uploads directory
   * @param filePath - Path to validate
   * @returns true if path is safe, false otherwise
   */
  private isValidPath(filePath: string): boolean {
    const resolvedPath = path.resolve(filePath);
    return resolvedPath.startsWith(this.UPLOAD_DIR);
  }

  /**
   * Generate a caption for an image
   * @param imagePath - Path to the image file
   * @returns Generated caption text
   */
  async generateCaption(imagePath: string): Promise<string> {
    try {
      // Validate the file path to prevent path traversal attacks
      if (!this.isValidPath(imagePath)) {
        throw new Error('Invalid file path');
      }

      // Verify file exists and is readable
      if (!fs.existsSync(imagePath)) {
        throw new Error('File not found');
      }

      // Read the image file as a Blob
      const imageBuffer = fs.readFileSync(imagePath);
      const blob = new Blob([imageBuffer]);
      
      // Use BLIP model for image captioning
      const result = await this.hf.imageToText({
        data: blob,
        model: 'Salesforce/blip-image-captioning-large',
      });

      return result.generated_text || 'Unable to generate caption';
    } catch (error) {
      console.error('Error generating caption:', error);
      throw new Error('Failed to generate caption');
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!HF_TOKEN;
  }
}

export default new CaptionService();
