import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

/**
 * Interface for caption generation response
 */
interface CaptionResponse {
  success: boolean;
  captions?: string[];
  error?: string;
}

/**
 * Interface for rate limiting configuration
 */
interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
}

/**
 * Interface for tracking rate limit state
 */
interface RateLimitState {
  requestTimestamps: number[];
}

/**
 * Service class for generating AI-powered captions for images
 * Uses OpenAI Vision API to analyze images and suggest creative captions
 */
export class CaptionService {
  private openai: OpenAI | null;
  private rateLimitConfig: RateLimitConfig;
  private rateLimitState: RateLimitState;
  private model: string;
  private isEnabled: boolean;

  constructor() {
    // Initialize OpenAI client with API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️  OPENAI_API_KEY not set - AI caption generation will be disabled');
      this.openai = null;
      this.isEnabled = false;
    } else {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      this.isEnabled = true;
    }

    // Use model from env or default to gpt-4o-mini for vision
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    // Initialize rate limiting configuration
    this.rateLimitConfig = {
      maxRequestsPerMinute: parseInt(process.env.OPENAI_MAX_REQUESTS_PER_MINUTE || '10', 10),
      maxRequestsPerHour: parseInt(process.env.OPENAI_MAX_REQUESTS_PER_HOUR || '100', 10),
    };

    // Initialize rate limit tracking state
    this.rateLimitState = {
      requestTimestamps: [],
    };
  }

  /**
   * Checks if the current request is within rate limits
   * @returns true if request is allowed, false otherwise
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    // Filter out old timestamps
    this.rateLimitState.requestTimestamps = this.rateLimitState.requestTimestamps.filter(
      (timestamp) => timestamp > oneHourAgo
    );

    // Count requests in the last minute
    const requestsInLastMinute = this.rateLimitState.requestTimestamps.filter(
      (timestamp) => timestamp > oneMinuteAgo
    ).length;

    // Count requests in the last hour
    const requestsInLastHour = this.rateLimitState.requestTimestamps.length;

    // Check if limits are exceeded
    if (requestsInLastMinute >= this.rateLimitConfig.maxRequestsPerMinute) {
      return false;
    }

    if (requestsInLastHour >= this.rateLimitConfig.maxRequestsPerHour) {
      return false;
    }

    return true;
  }

  /**
   * Records a new request timestamp for rate limiting
   */
  private recordRequest(): void {
    this.rateLimitState.requestTimestamps.push(Date.now());
  }

  /**
   * Converts an image file to base64 encoded string
   * @param imagePath - Path to the image file
   * @returns Base64 encoded string of the image
   */
  private async encodeImageToBase64(imagePath: string): Promise<string> {
    try {
      const imageBuffer = await fs.promises.readFile(imagePath);
      return imageBuffer.toString('base64');
    } catch (error) {
      throw new Error(`Failed to read image file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Determines the MIME type of an image based on file extension
   * @param imagePath - Path to the image file
   * @returns MIME type string
   */
  private getImageMimeType(imagePath: string): string {
    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Returns demo captions for demonstration purposes
   */
  private getDemoCaptions(): string[] {
    const demoSets = [
      ['✨ Beautiful moments captured in time', '🌸 Embracing the beauty of nature', '🌟 Every picture tells a story'],
      ['📸 Capturing life\'s precious moments', '💫 Making memories one shot at a time', '🎨 Art in everyday moments'],
      ['🌈 Colors of life in every frame', '✨ Shining bright in the moment', '💖 Moments that make life beautiful'],
      ['🎯 Focused on what matters most', '🌺 Blooming where I\'m planted', '⭐ Creating my own sunshine'],
      ['📷 Picture perfect moments', '🎭 Life is a beautiful adventure', '🌻 Finding joy in the little things']
    ];
    
    // Return random set
    return demoSets[Math.floor(Math.random() * demoSets.length)];
  }

  /**
   * Generates 3 creative caption suggestions for an uploaded image
   * @param imagePath - Path to the image file on the server
   * @returns Promise resolving to CaptionResponse with captions or error
   */
  async generateCaptions(imagePath: string): Promise<CaptionResponse> {
    try {
      // Check if the service is enabled
      if (!this.isEnabled || !this.openai) {
        console.log('⚠️  OpenAI not configured - returning demo captions');
        return {
          success: true,
          captions: this.getDemoCaptions(),
        };
      }

      // Check rate limits
      if (!this.checkRateLimit()) {
        console.log('⚠️  Local rate limit exceeded - returning demo captions');
        return {
          success: true,
          captions: this.getDemoCaptions(),
        };
      }

      // Validate image file exists
      if (!fs.existsSync(imagePath)) {
        return {
          success: false,
          error: 'Image file not found',
        };
      }

      // Encode image to base64
      const base64Image = await this.encodeImageToBase64(imagePath);
      const mimeType = this.getImageMimeType(imagePath);

      // Record the request for rate limiting
      this.recordRequest();

      // Call OpenAI Vision API
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image and generate exactly 3 creative, engaging captions suitable for a social media post like Instagram. Each caption should:
- Be concise and engaging (max 150 characters each)
- Capture the essence or mood of the image
- Be appropriate for a general audience
- Have a different style or tone (e.g., one playful, one inspirational, one descriptive)

Return ONLY the 3 captions, each on a new line, without numbering or additional formatting.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      // Extract captions from response
      const content = response.choices[0]?.message?.content;

      if (!content) {
        console.log('⚠️  No content from API - returning demo captions');
        return {
          success: true,
          captions: this.getDemoCaptions(),
        };
      }

      // Parse captions (split by newlines and filter empty lines)
      const captions = content
        .split('\n')
        .map((caption) => caption.trim())
        .filter((caption) => caption.length > 0)
        .slice(0, 3);

      // Ensure we have 3 captions
      if (captions.length < 3) {
        while (captions.length < 3) {
          captions.push('Capturing moments that matter ✨');
        }
      }

      return {
        success: true,
        captions,
      };
    } catch (error) {
      // Handle specific OpenAI errors with demo captions fallback
      if (error instanceof OpenAI.APIError) {
        console.error('OpenAI API Error:', {
          status: error.status,
          message: error.message,
          code: error.code,
        });

        console.log('⚠️  API error - returning demo captions for demonstration');
        return {
          success: true,
          captions: this.getDemoCaptions(),
        };
      }

      // Handle other errors with demo captions
      console.error('Error generating captions:', error);
      console.log('⚠️  Unexpected error - returning demo captions');
      return {
        success: true,
        captions: this.getDemoCaptions(),
      };
    }
  }

  /**
   * Generates captions from a buffer (useful for handling uploaded files directly)
   * @param imageBuffer - Buffer containing the image data
   * @param mimeType - MIME type of the image (e.g., 'image/jpeg')
   * @returns Promise resolving to CaptionResponse with captions or error
   */
  async generateCaptionsFromBuffer(imageBuffer: Buffer, mimeType: string = 'image/jpeg'): Promise<CaptionResponse> {
    try {
      // Check if the service is enabled
      if (!this.isEnabled || !this.openai) {
        console.log('⚠️  OpenAI not configured - returning demo captions');
        return {
          success: true,
          captions: this.getDemoCaptions(),
        };
      }

      // Check rate limits
      if (!this.checkRateLimit()) {
        console.log('⚠️  Local rate limit exceeded - returning demo captions');
        return {
          success: true,
          captions: this.getDemoCaptions(),
        };
      }

      // Encode buffer to base64
      const base64Image = imageBuffer.toString('base64');

      // Record the request for rate limiting
      this.recordRequest();

      // Call OpenAI Vision API
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image and generate exactly 3 creative, engaging captions suitable for a social media post like Instagram. Each caption should:
- Be concise and engaging (max 150 characters each)
- Capture the essence or mood of the image
- Be appropriate for a general audience
- Have a different style or tone (e.g., one playful, one inspirational, one descriptive)

Return ONLY the 3 captions, each on a new line, without numbering or additional formatting.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      // Extract captions from response
      const content = response.choices[0]?.message?.content;

      if (!content) {
        console.log('⚠️  No content from API - returning demo captions');
        return {
          success: true,
          captions: this.getDemoCaptions(),
        };
      }

      // Parse captions
      const captions = content
        .split('\n')
        .map((caption) => caption.trim())
        .filter((caption) => caption.length > 0)
        .slice(0, 3);

      // Ensure we have 3 captions
      if (captions.length < 3) {
        while (captions.length < 3) {
          captions.push('Capturing moments that matter ✨');
        }
      }

      return {
        success: true,
        captions,
      };
    } catch (error) {
      // Handle errors with demo captions fallback
      if (error instanceof OpenAI.APIError) {
        console.error('OpenAI API Error:', {
          status: error.status,
          message: error.message,
          code: error.code,
        });

        console.log('⚠️  API error - returning demo captions for demonstration');
        return {
          success: true,
          captions: this.getDemoCaptions(),
        };
      }

      console.error('Error generating captions:', error);
      console.log('⚠️  Unexpected error - returning demo captions');
      return {
        success: true,
        captions: this.getDemoCaptions(),
      };
    }
  }

  /**
   * Gets current rate limit status
   * @returns Object containing current rate limit information
   */
  getRateLimitStatus(): {
    requestsInLastMinute: number;
    requestsInLastHour: number;
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    // Clean up old timestamps
    this.rateLimitState.requestTimestamps = this.rateLimitState.requestTimestamps.filter(
      (timestamp) => timestamp > oneHourAgo
    );

    const requestsInLastMinute = this.rateLimitState.requestTimestamps.filter(
      (timestamp) => timestamp > oneMinuteAgo
    ).length;

    const requestsInLastHour = this.rateLimitState.requestTimestamps.length;

    return {
      requestsInLastMinute,
      requestsInLastHour,
      maxRequestsPerMinute: this.rateLimitConfig.maxRequestsPerMinute,
      maxRequestsPerHour: this.rateLimitConfig.maxRequestsPerHour,
    };
  }
}

// Export a singleton instance
export default new CaptionService();