import { HfInference } from '@huggingface/inference';
import * as fs from 'fs';

const HF_TOKEN = process.env.HUGGINGFACE_API_KEY || '';

/**
 * Service for generating image captions using AI
 */
export class CaptionService {
  private hf: HfInference;

  constructor() {
    this.hf = new HfInference(HF_TOKEN);
  }

  /**
   * Generate a caption for an image
   * @param imagePath - Path to the image file
   * @returns Generated caption text
   */
  async generateCaption(imagePath: string): Promise<string> {
    try {
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
